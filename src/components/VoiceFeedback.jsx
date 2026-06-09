import React from 'react'
import styles from './VoiceFeedback.module.css'

export default function VoiceFeedback({ listening, transcript, feedback }) {
  if (!listening && !transcript && !feedback) return null

  return (
    <div className={styles.wrap}>
      {listening && (
        <div className={styles.listening}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.hint}>Sizi dinliyorum…</span>
        </div>
      )}
      {transcript && (
        <div className={styles.transcript}>
          <i className="ti ti-quote" />
          {transcript}
        </div>
      )}
      {feedback && (
        <div className={styles.feedback}>{feedback}</div>
      )}
    </div>
  )
}
