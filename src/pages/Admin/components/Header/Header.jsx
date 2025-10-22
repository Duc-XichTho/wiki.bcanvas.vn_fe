import React from 'react'
import css from "./Header.module.css"

const Header = ({ setLayoutSelected }) => {
  return (
    <div className={css.main}>
      <div className={css.container}>
        <button onClick={() => setLayoutSelected("chain")}>CHAIN</button>
        <button onClick={() => setLayoutSelected("userClass")}>USER CLASS</button>
      </div>
    </div>
  )
}

export default Header