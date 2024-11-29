import styles from './LoadingSpinner.module.css';

export const LoadingSpinner = () => {
  return (
    <div className={styles.spinnerContainer}>
      <div className={styles.spinner} />
      <div className={styles.loadingText}>Loading transactions...</div>
    </div>
  );
}; 