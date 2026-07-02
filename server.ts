import { createServer } from "http";
import { parse } from "url";
import next from "next";
import express from "express";
import { Server as SocketIOServer } from "socket.io";
import * as pty from "node-pty";
import os from "os";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const expressApp = express();
    const server = createServer(expressApp);
    const io = new SocketIOServer(server, {
        path: "/socket.io",
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    console.log("Socket.io initialized on path /socket.io");

    const terminals = new Map<string, pty.IPty>();

    // Socket.io Logic
    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("join-room", (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);

            // Notify others in the room
            socket.to(roomId).emit("user-joined", { socketId: socket.id });
        });

        // Terminal Events
        socket.on("terminal-spawn", ({ termId, shell, cwd, reattach }) => {
            // Join the room for this terminal's output
            socket.join(`terminal-${termId}`);

            if (reattach && terminals.has(termId)) {
                console.log(`Socket ${socket.id} reattaching to terminal ${termId}`);
                socket.emit(`terminal-output-${termId}`, `\r\n\x1b[32mReattached to existing session ${termId}\x1b[0m\r\n`);
                return;
            }

            const shellPath = shell || (os.platform() === 'win32' ? 'powershell.exe' : 'zsh');

            // Security: Whitelist directories (basic check)
            const safeCwd = cwd || process.cwd();
            // TODO: Ensure safeCwd is within project boundaries

            console.log(`Spawning terminal: shell=${shellPath}, cwd=${safeCwd}, termId=${termId}`);

            try {
                const ptyProcess = pty.spawn(shellPath, [], {
                    name: 'xterm-color',
                    cols: 80,
                    rows: 24,
                    cwd: safeCwd,
                    env: process.env as any
                });

                terminals.set(termId, ptyProcess);
                console.log(`Terminal ${termId} spawned successfully (PID: ${ptyProcess.pid})`);

                ptyProcess.onData((data) => {
                    io.to(`terminal-${termId}`).emit(`terminal-output-${termId}`, data);
                });

                ptyProcess.onExit(({ exitCode, signal }) => {
                    console.log(`Terminal ${termId} exited with code ${exitCode}`);
                    socket.emit(`terminal-exit-${termId}`, { exitCode, signal });
                    terminals.delete(termId);
                });
            } catch (err) {
                console.error(`Failed to spawn terminal ${termId}:`, err);
                socket.emit(`terminal-output-${termId}`, `\r\n\x1b[31mError: Failed to spawn terminal session.\x1b[0m\r\n\x1b[31m${err instanceof Error ? err.message : String(err)}\x1b[0m\r\n`);
                socket.emit(`terminal-exit-${termId}`, { exitCode: 1, signal: 0 });
            }
        });

        socket.on("terminal-input", ({ termId, input }) => {
            const ptyProcess = terminals.get(termId);
            if (ptyProcess) {
                ptyProcess.write(input);
            }
        });

        socket.on("terminal-resize", ({ termId, cols, rows }) => {
            const ptyProcess = terminals.get(termId);
            if (ptyProcess) {
                ptyProcess.resize(cols, rows);
            }
        });

        socket.on("terminal-close", ({ termId }) => {
            const ptyProcess = terminals.get(termId);
            if (ptyProcess) {
                ptyProcess.kill();
                terminals.delete(termId);
                io.to(`terminal-${termId}`).emit(`terminal-exit-${termId}`, { exitCode: 0, signal: 0 });
            }
        });

        // Code change events
        socket.on("code-change", (data) => {
            socket.to(data.roomId).emit("code-update", data);
        });

        // Cursor/Selection events
        socket.on("cursor-move", (data) => {
            socket.to(data.roomId).emit("cursor-update", data);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });

    // Default Next.js Handler
    expressApp.all(/.*/, (req, res) => {
        if (req.url?.startsWith('/socket.io')) {
            return;
        }
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });
});
