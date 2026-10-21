<script lang="ts">
    import AppHeader from "$components/apps/app-header.svelte";
    import FourierDrawing from "$components/apps/fourier-drawing/fourier-drawing.svelte";
</script>

<AppHeader
    title="Fourier Drawing"
    description="Any drawing can be traced by a chain of rotating circles. Pick a shape or load a picture and watch the Fourier transform redraw it, one circle at a time."
/>

<FourierDrawing />

<section class="prose-custom mx-auto mt-16 max-w-3xl">
    <h2>How does it work?</h2>
    <ol>
        <li>
            <strong>Finding the lines.</strong> The picture is shrunk, blurred and
            scanned with a Canny edge detector. The edges are thinned to a single
            pixel and chained into strokes.
        </li>
        <li>
            <strong>One continuous path.</strong> The strokes are put in an order
            that keeps the pen travelling as little as possible, then joined into
            a single closed path, sampled at evenly spaced instants.
        </li>
        <li>
            <strong>Fourier transform.</strong> An FFT turns those samples into circles:
            the size of each one is how much of the drawing turns at that speed,
            and the speed is its frequency.
        </li>
        <li>
            <strong>Adding circles up.</strong> Each circle is centred on the tip
            of the previous one, so the last tip follows the path. The more circles
            you use, the sharper the drawing gets.
        </li>
    </ol>
</section>
