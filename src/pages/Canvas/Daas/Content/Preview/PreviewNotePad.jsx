import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from "react";
import ReactQuill, {Quill} from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ImageResize from 'quill-image-resize';
import css from './PreviewComponent.module.css';
import {CancelIconNotePad, EditIconNotePad, SaveIconNotePad} from "../../../../../icon/IconSVG.js";
import {toast} from "react-toastify";
import {updateFileNotePad} from "../../../../../apis/fileNotePadService.jsx";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {createTimestamp} from "../../../../../generalFunction/format.js";
import {requestSpeech} from "../../../../../apis/audioPlayService.jsx";
import {MuteIcon, SpeakerIcon} from "../../../../../icon/svg/IconSvg.jsx"; // Import CSS module

Quill.register('modules/imageResize', ImageResize);

const PreviewNotePad = ({data}) => {
    if (!data) return null;
    const [content, setContent] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    const fetchAllNote = async () => {
        try {
            const foundNote = data;
            if (foundNote) {
                setContent(foundNote.url);
            }
        } catch (error) {
            console.error("Error fetching or creating Note:", error);
        }
    };
    const fetchCurrentUser = async () => {
        const {data, error} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };
    useEffect(() => {
        fetchCurrentUser();
    }, []);


    useEffect(() => {
        fetchAllNote();
    }, [data]);

    const moduleON = {
        toolbar: [
            [
                {
                    header: [1, 2, 3, false]
                },
                'italic',
                'underline',
                'strike',
                {color: []},
                {background: []},
                {list: 'ordered'},
                {list: 'bullet'}
            ],
        ],
        imageResize: {},
        clipboard: {
            matchVisual: true,
        },
    };

    const moduleOFF = {
        toolbar: false,
    };
    const [isEditing, setIsEditing] = useState(false);
    const [originalContent, setOriginalContent] = useState('');

    const handleEditClick = () => {
        setIsEditing(true);
        setOriginalContent(content);
    };

    const handleSaveClick = async () => {
        try {
            let noteData = {
                id: data.id,
                name: data.name,
                url: content,
                type: "notepad",
                table: data.table,
                table_id: data.table_id,
                updated_at: createTimestamp(),
                user_update: currentUser.email
            };

            await updateFileNotePad(noteData);
            setIsEditing(false);
            toast.success('Đã lưu!', {
                position: "bottom-center"
            });
        } catch (error) {
            console.error("Error updating wiki note:", error);
        }
        // }
    };

    const handleCancelClick = () => {
        setContent(originalContent);
        setIsEditing(false);
    };

    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false); // Trạng thái loading
    const [duration, setDuration] = useState(0); // Thời gian tổng
    const [currentTime, setCurrentTime] = useState(0); // Thời gian hiện tại

    const removeHtmlTags = (htmlString) => {
        const doc = new DOMParser().parseFromString(htmlString, 'text/html');
        return doc.body.textContent || "";
    };

    const handleSpeaks = async (text) => {
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        try {
            setIsLoading(true)
            const response = await requestSpeech(removeHtmlTags(text));
            if (response.message === 'SUCCESS') {
                const newAudio = new Audio(response.audioUrl);
                audioRef.current = newAudio;
                newAudio.play();
                setIsPlaying(true);
                setIsLoading(false);
                newAudio.onloadedmetadata = () => {
                    setDuration(newAudio.duration); // Set duration
                };

                newAudio.ontimeupdate = () => {
                    setCurrentTime(newAudio.currentTime); // Set current time
                    setProgress((newAudio.currentTime / newAudio.duration) * 100);
                };

                // Khi âm thanh kết thúc, tự động dừng lại
                newAudio.onended = () => {
                    setIsPlaying(false);
                    setIsLoading(false);
                    setProgress(0);
                };
            }
        } catch (error) {
            toast.error('Không thể phát âm thanh. Vui lòng thử lại!');
            setIsLoading(false); // Dừng loading khi có lỗi

        }
    };

    const handleSeek = (event) => {
        const newTime = (event.target.value / 100) * audioRef.current.duration;
        audioRef.current.currentTime = newTime;
    };

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <>
            <div className={css.main}>
                <div className={css.quill}>
                    <ReactQuill
                        theme="snow"
                        key={isEditing ? 'edit' : 'view'}
                        value={content}
                        onChange={setContent}
                        modules={isEditing ? moduleON : moduleOFF}
                        readOnly={!isEditing}
                        className={`${css.reactQuill} ${!isEditing ? css.nonEditing : ''}`}
                    />
                </div>

                <div className={css.buttons2}>
                    {!isEditing && (
                        <div className={css.buttonWrapBF}>
                            {isLoading ? (
                                <div className={css.loadingCircle}></div>
                            ) : (
                                isPlaying ? (
                                    <div className={css.buttonWrap} onClick={() => handleSpeaks(content)}>
                                        <MuteIcon width={20} height={20}/>
                                    </div>) : (
                                    <div className={css.buttonWrap} onClick={() => handleSpeaks(content)}>
                                        <SpeakerIcon width={20} height={20}/>
                                    </div>
                                )
                            )}
                            {isPlaying && (
                                <>
                                    <div className={css.buttonWrap}>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={progress}
                                            onChange={handleSeek}
                                            step="1"
                                        />
                                    </div>
                                    <div className={css.timeDisplay}>
                                        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                                    </div>
                                </>
                            )}

                            <div onClick={handleEditClick} className={css.buttonWrap}>
                                <img src={EditIconNotePad} alt=""/>
                                <span>Sửa</span>
                            </div>
                        </div>
                    )}
                    {isEditing && (
                        <div className={css.buttonWrapAF}>
                            <div onClick={handleSaveClick} className={css.buttonWrap}>
                                <img src={SaveIconNotePad} alt=""/>
                                <span>Lưu</span>
                            </div>
                            <div onClick={handleCancelClick} className={css.buttonWrap}>
                                <img src={CancelIconNotePad} alt=""/>
                                <span>Hủy</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
        ;
};

PreviewNotePad.propTypes = {
    data: PropTypes.object.isRequired,
};

export default PreviewNotePad;
