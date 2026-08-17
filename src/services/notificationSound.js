const sounds = {
    dueToday: "/sounds/due-today.mp3",
    late: "/sounds/late.mp3",
    upcoming: "/sounds/upcoming.mp3",
};

export const playNotificationSound = (type, volume = 0.7) => {
    return new Promise((resolve) => {
        const audio = new Audio(sounds[type]);

        audio.volume = volume;

        audio.onended = () => {
            resolve();
        };

        audio.onerror = () => {
            resolve();
        };

        audio.play().catch(() => {
            resolve();
        });
    });
};