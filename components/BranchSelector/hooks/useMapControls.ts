"use client";

import { useReducer } from "react";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "../constants";

type State = {
  center: { lat: number; lng: number };
  zoom: number;
  selectedMarkerId: number | null;
};

type Action =
  | { type: "focus"; id: number; center: { lat: number; lng: number }; zoom?: number }
  | { type: "setCenter"; center: { lat: number; lng: number } };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "focus":
      return {
        ...state,
        selectedMarkerId: action.id,
        center: action.center,
        zoom: action.zoom ?? state.zoom,
      };
    case "setCenter":
      return { ...state, center: action.center };
    default:
      return state;
  }
};

export const useMapControls = () =>
  useReducer(reducer, { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, selectedMarkerId: null });

