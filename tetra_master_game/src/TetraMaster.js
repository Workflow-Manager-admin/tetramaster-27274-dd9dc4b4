import React, { useState, useEffect, useRef, useCallback } from "react";

/**
 * TetraMaster (Tetris-like) main game container.
 *
 * Features:
 *  - Block movement (left, right, down)
 *  - Block rotation
 *  - Line clearing
 *  - Score tracking
 *  - Level progression (based on lines cleared)
 *  - Game-over detection
 *  - Layout: grid in center, info on right, controls below
 *  - Themed styling (primary: #222831, secondary: #393e46, accent: #00adb5)
 */

// Theme colors
const COLORS = {
  primary: "#222831",
  secondary: "#393e46",
  accent: "#00adb5",
  blockColors: [
    "#00adb5", // cyan (I)
    "#e84545", // red (Z)
    "#fdca40", // yellow (O)
    "#6a89cc", // blue (J)
    "#f6ab6c", // orange (L)
    "#16c79a", // green (S)
    "#9153c9", // purple (T)
  ],
};

// Tetris shapes and their rotations
const SHAPES = [
  // I
  [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
  // Z
  [
    [
      [2, 2, 0],
      [0, 2, 2],
      [0, 0, 0],
    ],
    [
      [0, 2, 0],
      [2, 2, 0],
      [2, 0, 0],
    ],
  ],
  // O
  [
    [
      [3, 3],
      [3, 3],
    ],
  ],
  // J
  [
    [
      [0, 4, 0],
      [0, 4, 0],
      [4, 4, 0],
    ],
    [
      [4, 0, 0],
      [4, 4, 4],
      [0, 0, 0],
    ],
    [
      [0, 4, 4],
      [0, 4, 0],
      [0, 4, 0],
    ],
    [
      [0, 0, 0],
      [4, 4, 4],
      [0, 0, 4],
    ],
  ],
  // L
  [
    [
      [0, 5, 0],
      [0, 5, 0],
      [0, 5, 5],
    ],
    [
      [0, 0, 0],
      [5, 5, 5],
      [5, 0, 0],
    ],
    [
      [5, 5, 0],
      [0, 5, 0],
      [0, 5, 0],
    ],
    [
      [0, 0, 5],
      [5, 5, 5],
      [0, 0, 0],
    ],
  ],
  // S
  [
    [
      [0, 6, 6],
      [6, 6, 0],
      [0, 0, 0],
    ],
    [
      [6, 0, 0],
      [6, 6, 0],
      [0, 6, 0],
    ],
  ],
  // T
  [
    [
      [0, 7, 0],
      [7, 7, 7],
      [0, 0, 0],
    ],
    [
      [0, 7, 0],
      [0, 7, 7],
      [0, 7, 0],
    ],
    [
      [0, 0, 0],
      [7, 7, 7],
      [0, 7, 0],
    ],
    [
      [0, 7, 0],
      [7, 7, 0],
      [0, 7, 0],
    ],
  ],
];

// Playfield constants
const ROWS = 20;
const COLS = 10;
const EMPTY = 0;

// Utility: Generate empty grid
function createGrid() {
  return Array(ROWS)
    .fill(null)
    .map(() => Array(COLS).fill(EMPTY));
}

// Utility: get random shape index
function getRandomShape() {
  return Math.floor(Math.random() * SHAPES.length);
}

// PUBLIC_INTERFACE
function TetraMaster() {
  /**
   * Main game container. Handles all game state, display and logic.
   */

  // State
  const [grid, setGrid] = useState(createGrid());
  const [current, setCurrent] = useState(getNewPiece());
  const [next, setNext] = useState(getNewPiece());
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesCleared, setLinesCleared] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(true); // To allow drop/pause/continue

  // Timing (speed based on level)
  const dropInterval = Math.max(800 - (level - 1) * 65, 120); // milliseconds

  // For throttling repeated keydown
  const pressedKeysRef = useRef({});
  // For managing game tick interval
  const timerRef = useRef(null);

  // Main game tick: drop piece down
  useEffect(() => {
    if (!isRunning || gameOver) return;
    // Clean up previous interval
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      handleMove("down");
    }, dropInterval);

    return () => timerRef.current && clearInterval(timerRef.current);
    // eslint-disable-next-line
  }, [current, isRunning, dropInterval, gameOver]);

  // Handle controls (keyboard)
  useEffect(() => {
    if (!isRunning || gameOver) return;
    function handleKeyDown(e) {
      if (pressedKeysRef.current[e.code]) return;
      pressedKeysRef.current[e.code] = true;

      switch (e.code) {
        case "ArrowLeft":
          handleMove("left");
          break;
        case "ArrowRight":
          handleMove("right");
          break;
        case "ArrowDown":
          handleMove("down");
          break;
        case "ArrowUp":
        case "KeyX":
        case "Space":
          handleMove("rotate");
          break;
        case "Escape":
          setIsRunning((r) => !r);
          break;
        default:
          break;
      }
    }
    function handleKeyUp(e) {
      pressedKeysRef.current[e.code] = false;
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
    // eslint-disable-next-line
  }, [current, isRunning, gameOver]);

  // Helper: Get a new piece
  function getNewPiece() {
    const type = getRandomShape();
    return {
      type, // index into SHAPES
      rotation: 0,
      row: -2, // start above grid to allow entry
      col: Math.floor(COLS / 2) - 2,
    };
  }

  // Helper: Get shape matrix for piece
  function getShapeMatrix(piece) {
    const { type, rotation } = piece;
    const shapeSet = SHAPES[type];
    return shapeSet[rotation % shapeSet.length];
  }

  // Helper: Check collision (with walls, floor, or occupied cells)
  function isColliding(piece, targetRow = piece.row, targetCol = piece.col, testRotation = piece.rotation) {
    const matrix = SHAPES[piece.type][testRotation % SHAPES[piece.type].length];
    for (let r = 0; r < matrix.length; ++r) {
      for (let c = 0; c < matrix[0].length; ++c) {
        if (matrix[r][c]) {
          const gridRow = targetRow + r;
          const gridCol = targetCol + c;
          if (
            gridCol < 0 ||
            gridCol >= COLS ||
            gridRow >= ROWS ||
            (gridRow >= 0 && grid[gridRow][gridCol])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Place the piece
  function placePieceOnGrid(piece, gridToUse = grid, valueOverride = null) {
    // Returns a grid copy with the current piece "placed"
    const tempGrid = gridToUse.map((row) => [...row]);
    const matrix = getShapeMatrix(piece);
    for (let r = 0; r < matrix.length; ++r) {
      for (let c = 0; c < matrix[0].length; ++c) {
        if (matrix[r][c]) {
          const gridRow = piece.row + r;
          const gridCol = piece.col + c;
          if (gridRow >= 0 && gridRow < ROWS && gridCol >= 0 && gridCol < COLS) {
            tempGrid[gridRow][gridCol] = valueOverride !== null ? valueOverride : matrix[r][c];
          }
        }
      }
    }
    return tempGrid;
  }

  // Move/rotate piece handler
  // PUBLIC_INTERFACE
  function handleMove(action) {
    if (!isRunning || gameOver) return;

    let newPiece = { ...current };
    if (action === "left") {
      if (!isColliding(newPiece, newPiece.row, newPiece.col - 1, newPiece.rotation)) {
        newPiece.col -= 1;
        setCurrent(newPiece);
      }
    } else if (action === "right") {
      if (!isColliding(newPiece, newPiece.row, newPiece.col + 1, newPiece.rotation)) {
        newPiece.col += 1;
        setCurrent(newPiece);
      }
    } else if (action === "down") {
      if (!isColliding(newPiece, newPiece.row + 1, newPiece.col, newPiece.rotation)) {
        newPiece.row += 1;
        setCurrent(newPiece);
      } else {
        // Piece landed
        const withPlaced = placePieceOnGrid(newPiece);
        const [clearedGrid, numCleared] = clearCompleteLines(withPlaced);
        setGrid(clearedGrid);
        setScore((s) => s + getScoreForLines(numCleared, level));
        setLinesCleared((l) => {
          const total = l + numCleared;
          handleLevelAdvancement(total);
          return total;
        });
        // New piece and check game over
        const nextPiece = { ...next, row: -2, col: Math.floor(COLS / 2) - 2 };
        if (isColliding(nextPiece, nextPiece.row, nextPiece.col, nextPiece.rotation)) {
          setGameOver(true);
          setIsRunning(false);
        } else {
          setCurrent(nextPiece);
          setNext(getNewPiece());
        }
      }
    } else if (action === "rotate") {
      const nextRot = (newPiece.rotation + 1) % SHAPES[newPiece.type].length;
      if (!isColliding(newPiece, newPiece.row, newPiece.col, nextRot)) {
        newPiece.rotation = nextRot;
        setCurrent(newPiece);
      } else {
        // Try basic wallkicks: left, right
        if (!isColliding(newPiece, newPiece.row, newPiece.col - 1, nextRot)) {
          newPiece.col -= 1;
          newPiece.rotation = nextRot;
          setCurrent(newPiece);
        } else if (!isColliding(newPiece, newPiece.row, newPiece.col + 1, nextRot)) {
          newPiece.col += 1;
          newPiece.rotation = nextRot;
          setCurrent(newPiece);
        }
      }
    }
  }

  // PUBLIC_INTERFACE
  function startNewGame() {
    setGrid(createGrid());
    setCurrent(getNewPiece());
    setNext(getNewPiece());
    setScore(0);
    setLevel(1);
    setLinesCleared(0);
    setGameOver(false);
    setIsRunning(true);
  }

  // Level progression
  function handleLevelAdvancement(totalLinesCleared) {
    // Increase level every 10 lines cleared, max 15
    const newLevel = Math.min(1 + Math.floor(totalLinesCleared / 10), 15);
    setLevel(newLevel);
  }

  // Score calculation
  function getScoreForLines(lines, lvl) {
    // Standard Tetris scoring (single: 40pts, double: 100, triple: 300, tetris: 1200 * level)
    const base = [0, 40, 100, 300, 1200];
    return (base[lines] || 0) * lvl;
  }

  // PUBLIC_INTERFACE
  function clearCompleteLines(gridToCheck) {
    let cleared = 0;
    const newGrid = gridToCheck.filter((row) => {
      if (row.every((cell) => cell !== EMPTY)) {
        cleared += 1;
        return false;
      }
      return true;
    });
    // Add empty rows at the top for each cleared
    while (newGrid.length < ROWS) newGrid.unshift(Array(COLS).fill(EMPTY));
    return [newGrid, cleared];
  }

  // Merge grid with current piece for display
  const displayGrid = placePieceOnGrid(current);

  // Render helpers
  function renderCell(val, r, c) {
    return (
      <div
        key={`${r}-${c}`}
        style={{
          width: "26px",
          height: "26px",
          border: `1.5px solid ${COLORS.secondary}`,
          background: val
            ? COLORS.blockColors[(val - 1) % COLORS.blockColors.length]
            : COLORS.primary,
          boxShadow: val
            ? `0 2px 8px 0 ${COLORS.blockColors[(val - 1) % COLORS.blockColors.length]}44`
            : "none",
          transition: "background 0.15s",
        }}
      />
    );
  }

  function renderGrid() {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${ROWS}, 26px)`,
          gridTemplateColumns: `repeat(${COLS}, 26px)`,
          background: COLORS.primary,
          border: `3px solid ${COLORS.accent}`,
          boxShadow: `0 6px 20px 0 #0005`,
          borderRadius: "6px",
        }}
      >
        {displayGrid.map((row, r) =>
          row.map((val, c) => renderCell(val, r, c))
        )}
      </div>
    );
  }

  function renderNextPreview() {
    const matrix = getShapeMatrix(next);
    // Small grid centered on next piece size
    return (
      <div
        style={{
          background: COLORS.secondary,
          borderRadius: "5px",
          border: `2px solid ${COLORS.accent}`,
          padding: "16px",
          width: "105px",
          minHeight: "105px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateRows: `repeat(${matrix.length}, 18px)`,
            gridTemplateColumns: `repeat(${matrix[0].length}, 18px)`,
            gap: "1px",
          }}
        >
          {matrix.map((row, r) =>
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                style={{
                  width: 18,
                  height: 18,
                  background: val
                    ? COLORS.blockColors[(val - 1) % COLORS.blockColors.length]
                    : COLORS.secondary,
                  borderRadius: val ? "4px" : "0",
                  border: val ? `1.2px solid ${COLORS.accent}` : "none",
                }}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  function renderInfoPanel() {
    return (
      <div
        style={{
          background: COLORS.secondary,
          color: "#fff",
          padding: "28px 18px 18px 18px",
          borderRadius: "8px",
          border: `2px solid ${COLORS.accent}`,
          minWidth: "180px",
          marginLeft: "28px",
          minHeight: "calc(26px * 20 + 10px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: "0 2px 12px 0 #0004",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: "1.32rem", marginBottom: 12 }}>
          Score
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: "2rem",
            color: COLORS.accent,
            marginBottom: 12,
          }}
          data-testid="score"
        >
          {score}
        </div>
        <div style={{ marginBottom: 14, fontWeight: 500, fontSize: "1.09rem" }}>
          Level <span style={{ color: COLORS.accent }}>{level}</span>
        </div>
        <div style={{ marginTop: "16px", marginBottom: "12px", fontWeight: 600 }}>
          Next
        </div>
        {renderNextPreview()}
        <div
          style={{
            marginTop: "32px",
            textAlign: "center",
            color: "#eee",
            fontSize: "0.97rem",
            opacity: 0.77,
            lineHeight: 1.4,
          }}
        >
          <span style={{ fontWeight: 600 }}>Lines:</span> {linesCleared}
        </div>
      </div>
    );
  }

  function renderGameOverModal() {
    if (!gameOver) return null;
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "#222b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          flexDirection: "column",
        }}
      >
        <div
          style={{
            background: COLORS.secondary,
            color: "#fff",
            padding: "32px 68px",
            borderRadius: "12px",
            textAlign: "center",
            border: `3.5px solid ${COLORS.accent}`,
            fontSize: "2rem",
            boxShadow: "0 8px 34px 0 #0007",
            fontWeight: 700,
          }}
        >
          Game Over
          <div
            style={{
              marginTop: "24px",
              fontSize: "1.18rem",
              color: COLORS.accent,
              fontWeight: 500,
            }}
          >
            Final Score: {score}
          </div>
          <button
            className="btn btn-large"
            style={{
              marginTop: "28px",
              fontSize: "1.15rem",
              background: COLORS.accent,
              padding: "11px 32px",
              fontWeight: 600,
              borderRadius: "7px",
              border: "none",
              cursor: "pointer",
              color: "#fff",
              boxShadow: `0 2px 10px 0 ${COLORS.accent}30`,
            }}
            onClick={startNewGame}
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  function renderControls() {
    return (
      <div
        style={{
          margin: "0 auto",
          marginTop: "18px",
          padding: "14px 12px",
          textAlign: "center",
          background: COLORS.secondary,
          borderRadius: "7px",
          color: "#fff",
          fontSize: "1.08rem",
          maxWidth: "510px",
          boxShadow: "0 1.5px 8px 0 #0002",
        }}
      >
        <b style={{ color: COLORS.accent }}>Controls: </b>
        <span style={{ margin: "0 5px" }}>
          ←/<span style={{ letterSpacing: "-4px" }} />
          →:
          <span style={{ color: "#aaa" }}> Move</span>
        </span>
        <span style={{ margin: "0 5px" }}>
          ↓: <span style={{ color: "#aaa" }}>Soft Drop</span>{" "}
        </span>
        <span style={{ margin: "0 5px" }}>
          ↑/X/Space: <span style={{ color: "#aaa" }}>Rotate</span>
        </span>
        <span style={{ margin: "0 5px" }}>
          Esc: <span style={{ color: "#aaa" }}>Pause</span>
        </span>
      </div>
    );
  }

  // Main render
  return (
    <div
      style={{
        fontFamily: "'Inter', 'Roboto', 'Arial', sans-serif",
        background: COLORS.primary,
        minHeight: "calc(100vh - 32px)",
        margin: "-20px", // to span outside container
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "start",
        position: "relative",
        paddingTop: "56px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", marginTop: "30px" }}>
        <div
          style={{
            position: "relative",
            userSelect: "none",
            margin: "auto",
          }}
        >
          {renderGrid()}
          {renderGameOverModal()}
        </div>
        <div>{renderInfoPanel()}</div>
      </div>
      {renderControls()}
      <div
        style={{
          marginTop: "18px",
          color: "#aaa",
          fontSize: "0.98rem",
          textAlign: "center",
          opacity: 0.55,
        }}
      >
        {isRunning ? (
          `Level speed: ${dropInterval}ms/piece`
        ) : (
          <span style={{ color: COLORS.accent, fontWeight: 600 }}>Paused</span>
        )}
        {gameOver && <span> — Press Play Again</span>}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export default TetraMaster;
