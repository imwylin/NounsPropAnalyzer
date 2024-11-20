import styles from './treasury.module.css';

export default function Treasury() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Treasury Overview</h1>
      <div className={styles.comingSoon}>
        <h2>Coming Soon</h2>
        <p>Treasury monitoring and analysis features are currently under development.</p>
      </div>
    </div>
  );
} 