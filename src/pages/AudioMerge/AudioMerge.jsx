import React, { useState, useRef, useEffect } from 'react';

export default function AudioMixer() {
	const [files, setFiles] = useState([]);
	const [isPlaying, setIsPlaying] = useState(false);
	const [volume, setVolume] = useState(1);
	const [fileVolumes, setFileVolumes] = useState([1, 1]);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);

	const audioCtxRef = useRef(null);
	const startTimeRef = useRef(null);
	const sourceNodesRef = useRef([]);
	const gainNodesRef = useRef([]);
	const masterGainRef = useRef(null);
	const animationFrameRef = useRef();

	const handleFiles = (e) => {
		const selected = Array.from(e.target.files);
		if (selected.length !== 2) {
			alert('Hãy chọn đúng 2 file MP3.');
			return;
		}
		setFiles(selected);
		setFileVolumes([1, 1]);
		setIsPlaying(false);
		setCurrentTime(0);
		setDuration(0);
	};

	const decodeFile = (audioCtx, file) =>
		new Promise((resolve, reject) => {
			file.arrayBuffer().then((buffer) => {
				audioCtx.decodeAudioData(buffer, resolve, reject);
			});
		});

	const updateTime = () => {
		const elapsed = (audioCtxRef.current.currentTime - startTimeRef.current) || 0;
		setCurrentTime(Math.min(elapsed, duration));
		animationFrameRef.current = requestAnimationFrame(updateTime);
	};

	const handlePlay = async () => {
		if (!files.length) return;

		const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		audioCtxRef.current = audioCtx;

		const masterGain = audioCtx.createGain();
		masterGain.gain.value = volume;
		masterGain.connect(audioCtx.destination);
		masterGainRef.current = masterGain;

		const sources = [];
		const gains = [];

		const buffers = await Promise.all(files.map((f) => decodeFile(audioCtx, f)));

		const maxDur = Math.max(...buffers.map((b) => b.duration));
		setDuration(maxDur);

		buffers.forEach((buffer, i) => {
			const source = audioCtx.createBufferSource();
			source.buffer = buffer;

			const gain = audioCtx.createGain();
			gain.gain.value = fileVolumes[i];

			source.connect(gain);
			gain.connect(masterGain);

			source.start();

			sources.push(source);
			gains.push(gain);
		});

		sourceNodesRef.current = sources;
		gainNodesRef.current = gains;
		setIsPlaying(true);
		startTimeRef.current = audioCtx.currentTime;
		updateTime();

		// Stop audio when done
		setTimeout(() => {
			stopAudio();
		}, maxDur * 1000 + 200);
	};

	const stopAudio = () => {
		sourceNodesRef.current.forEach((src) => {
			try {
				src.stop();
			} catch {}
		});
		audioCtxRef.current?.close();
		setIsPlaying(false);
		cancelAnimationFrame(animationFrameRef.current);
		setCurrentTime(0);
	};

	const handleVolumeChange = (v) => {
		setVolume(v);
		if (masterGainRef.current) {
			masterGainRef.current.gain.value = v;
		}
	};

	const handleFileVolumeChange = (index, v) => {
		const newVolumes = [...fileVolumes];
		newVolumes[index] = v;
		setFileVolumes(newVolumes);
		if (gainNodesRef.current[index]) {
			gainNodesRef.current[index].gain.value = v;
		}
	};

	const formatTime = (seconds) => {
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	};

	return (
		<div style={{ maxWidth: 500, margin: 'auto', padding: 20, fontFamily: 'sans-serif' }}>
			<h2 style={{ textAlign: 'center' }}>🎧 Audio Mixer</h2>
			<input type="file" accept="audio/mp3" multiple onChange={handleFiles} />
			<br />

			{files.length === 2 && (
				<div style={{ marginTop: 20 }}>
					{/* Tên file */}
					<div style={{ marginBottom: 10 }}>
						<strong>🎵 {files[0].name}</strong>
						<br />
						<strong>🎵 {files[1].name}</strong>
					</div>

					{/* Thanh thời gian */}
					<div style={{ margin: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
						<span>{formatTime(currentTime)}</span>
						<span>{formatTime(duration)}</span>
					</div>
					<div style={{ background: '#ccc', height: 6, borderRadius: 3 }}>
						<div
							style={{
								background: '#007bff',
								height: 6,
								width: `${(currentTime / duration) * 100 || 0}%`,
								borderRadius: 3,
							}}
						></div>
					</div>

					{/* Nút điều khiển */}
					<div style={{ margin: '20px 0', textAlign: 'center' }}>
						{!isPlaying ? (
							<button onClick={handlePlay} style={buttonStyle}>▶ Play</button>
						) : (
							<button onClick={stopAudio} style={buttonStyle}>⏹ Stop</button>
						)}
					</div>

					{/* Âm lượng tổng */}
					<div style={{ marginBottom: 15 }}>
						<label>🔊 Âm lượng tổng: </label>
						<input
							type="range"
							min={0}
							max={2}
							step={0.01}
							value={volume}
							onChange={(e) => handleVolumeChange(Number(e.target.value))}
						/>
						<span> {volume.toFixed(2)}</span>
					</div>

					{/* Âm lượng từng file */}
					{[0, 1].map((i) => (
						<div key={i} style={{ marginBottom: 15 }}>
							<label>🎚️ Âm lượng file {i + 1}: </label>
							<input
								type="range"
								min={0}
								max={2}
								step={0.01}
								value={fileVolumes[i]}
								onChange={(e) =>
									handleFileVolumeChange(i, Number(e.target.value))
								}
							/>
							<span> {fileVolumes[i].toFixed(2)}</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

const buttonStyle = {
	padding: '10px 20px',
	fontSize: '16px',
	background: '#007bff',
	color: '#fff',
	border: 'none',
	borderRadius: '6px',
	cursor: 'pointer',
};
