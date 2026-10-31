import { defineConfig } from "vite";
import motionCanvas from "@motion-canvas/vite-plugin";
import ffmpeg from "@motion-canvas/ffmpeg";

export default defineConfig({
    plugins: [motionCanvas({ project: ["./src/projects/*.ts"] }), ffmpeg()],
    resolve: { dedupe: ["@motion-canvas/core", "@motion-canvas/2d"] },
    build: {
        outDir: "../docs/public/videos",
        emptyOutDir: true,
        rollupOptions: {
            output: {
                entryFileNames: "projects/[name].js",
                chunkFileNames: "chunks/[name]-[hash].js",
            },
        },
    },
});
