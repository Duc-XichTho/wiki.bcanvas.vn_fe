import css from './DocumentShare.module.css'
import Tiptap from './ComponentWarehouse/TipTap.jsx'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getFileNotePadById } from '../../../apis/public/fileNotePadService'

export default function DocumentShare() {
  const { id } = useParams()
  const [fileNotePad, setFileNotePad] = useState(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [])

  const fetchData = async () => {
    try {
      const data = await getFileNotePadById(id)
      setFileNotePad(data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  return (
    <div className={css.main}>
      <div className={css.mainWrap}>
        <Tiptap fileNotePad={fileNotePad} fetchData={fetchData} />
      </div>
    </div>
  )
}