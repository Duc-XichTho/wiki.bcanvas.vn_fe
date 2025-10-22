import styles from './DMChung.module.css'
import {useState} from 'react';
import Unit from "./Unit.jsx";
import Team from "./Team.jsx";

export default function DMChung({company}) {
    const [text_input, setTextInput] = useState('')

    return (
        <>

            <div className={styles.layout}>
                <div className={styles.first_table}>
                    <Unit text_input={text_input} company={company}/>
                </div>

                <div className={styles.second_table}>
                    <Team text_input={text_input} company={company}/>
                </div>
            </div>

        </>
    )
}
