// Pomodoro Timer
class PomodoroTimer {
    constructor() {
        this.minutes = 25;
        this.seconds = 0;
        this.isRunning = false;
        this.interval = null;
        
        this.minutesDisplay = document.getElementById('minutes');
        this.secondsDisplay = document.getElementById('seconds');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.start());
            this.pauseBtn.addEventListener('click', () => this.pause());
            this.resetBtn.addEventListener('click', () => this.reset());
        }
    }
    
    updateDisplay() {
        if (this.minutesDisplay && this.secondsDisplay) {
            this.minutesDisplay.textContent = String(this.minutes).padStart(2, '0');
            this.secondsDisplay.textContent = String(this.seconds).padStart(2, '0');
        }
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        this.interval = setInterval(() => {
            if (this.seconds === 0) {
                if (this.minutes === 0) {
                    this.timerComplete();
                } else {
                    this.minutes--;
                    this.seconds = 59;
                }
            } else {
                this.seconds--;
            }
            this.updateDisplay();
        }, 1000);
    }
    
    pause() {
        if (!this.isRunning) return;
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    reset() {
        this.pause();
        this.minutes = 25;
        this.seconds = 0;
        this.updateDisplay();
    }
    
    timerComplete() {
        this.pause();
        alert('⏰ Time is up! Take a break!');
        this.reset();
    }
}

// Initialize timer when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('minutes')) {
        new PomodoroTimer();
    }
});