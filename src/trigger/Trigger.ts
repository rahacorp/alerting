interface Trigger {
    start();
    stop();
    fire: () => void;
}