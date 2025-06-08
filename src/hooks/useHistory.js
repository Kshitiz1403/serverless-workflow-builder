import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY_SIZE = 50;

export function useHistory(initialState) {
 const [currentState, setCurrentState] = useState(initialState);
 const [currentIndex, setCurrentIndex] = useState(0);
 const historyRef = useRef([initialState]);
 const isUndoRedoRef = useRef(false);

 const pushToHistory = useCallback((newState) => {
  if (isUndoRedoRef.current) {
   isUndoRedoRef.current = false;
   return;
  }

  const newHistory = historyRef.current.slice(0, currentIndex + 1);
  newHistory.push(newState);

  // Limit history size
  if (newHistory.length > MAX_HISTORY_SIZE) {
   newHistory.shift();
  } else {
   setCurrentIndex(prev => prev + 1);
  }

  historyRef.current = newHistory;
  setCurrentState(newState);
 }, [currentIndex]);

 const undo = useCallback(() => {
  if (currentIndex > 0) {
   isUndoRedoRef.current = true;
   const newIndex = currentIndex - 1;
   setCurrentIndex(newIndex);
   const previousState = historyRef.current[newIndex];
   setCurrentState(previousState);
   return previousState;
  }
  return null;
 }, [currentIndex]);

 const redo = useCallback(() => {
  if (currentIndex < historyRef.current.length - 1) {
   isUndoRedoRef.current = true;
   const newIndex = currentIndex + 1;
   setCurrentIndex(newIndex);
   const nextState = historyRef.current[newIndex];
   setCurrentState(nextState);
   return nextState;
  }
  return null;
 }, [currentIndex]);

 const canUndo = currentIndex > 0;
 const canRedo = currentIndex < historyRef.current.length - 1;

 const reset = useCallback((newInitialState) => {
  historyRef.current = [newInitialState];
  setCurrentIndex(0);
  setCurrentState(newInitialState);
 }, []);

 return {
  state: currentState,
  setState: pushToHistory,
  undo,
  redo,
  canUndo,
  canRedo,
  reset,
 };
} 