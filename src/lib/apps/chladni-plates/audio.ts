/** The loudest the tone ever gets: a pure tone is tiring and the volume of the computer is not ours to guess. */
const LOUDEST = 0.12;

/** How quickly the volume and the pitch follow what they are told to do, so that there are no clicks. */
const SMOOTHING = 0.03;

/**
 * The sound of the shaker: a pure tone at the frequency that the plate is shaken at, which gets louder as the plate
 * resonates, like a real plate does.
 *
 * Browsers only let a page make sound once the visitor has done something on it, which is why the tone is started by
 * a call that comes from a click.
 */
export class Tone {
    private context: AudioContext | null = null;
    private oscillator: OscillatorNode | null = null;
    private gain: GainNode | null = null;

    /** Starts the tone. It stays silent until `set` says how high and how loud. */
    start(): void {
        if (this.context) return;

        this.context = new AudioContext();
        this.oscillator = this.context.createOscillator();
        this.gain = this.context.createGain();

        this.oscillator.type = 'sine';
        this.gain.gain.value = 0;

        this.oscillator.connect(this.gain).connect(this.context.destination);
        this.oscillator.start();
    }

    /** Changes the pitch (in hertz) and the volume (from 0 to 1). */
    set(frequency: number, volume: number): void {
        if (!this.context || !this.oscillator || !this.gain) return;

        const now = this.context.currentTime;

        this.oscillator.frequency.setTargetAtTime(frequency, now, SMOOTHING);
        this.gain.gain.setTargetAtTime(LOUDEST * Math.max(0, Math.min(1, volume)), now, SMOOTHING);
    }

    /** Stops the tone, and lets go of the audio. */
    stop(): void {
        this.oscillator?.stop();
        void this.context?.close();

        this.oscillator = null;
        this.gain = null;
        this.context = null;
    }
}
