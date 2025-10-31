import { useReducer, useCallback } from 'react';

/**
 * Action types for app state management
 */
export const APP_ACTIONS = {
    SET_VIEW: 'SET_VIEW',
    SET_SEARCH_TERM: 'SET_SEARCH_TERM',
    SET_ALL_PLACES: 'SET_ALL_PLACES',
    SET_DISPLAYED_PLACES: 'SET_DISPLAYED_PLACES',
    SET_CURRENT_LOCATION: 'SET_CURRENT_LOCATION',
    SET_SELECTED_PLACE: 'SET_SELECTED_PLACE',
    SET_MAP_STATE: 'SET_MAP_STATE',
    SET_LOCATIONS: 'SET_LOCATIONS',
    SET_CURRENT_LOCATION_ID: 'SET_CURRENT_LOCATION_ID',
    SET_IS_LOADING: 'SET_IS_LOADING',
    SET_DISCOVERED_PLACES: 'SET_DISCOVERED_PLACES',
    SET_DISCOVERY_IN_PROGRESS: 'SET_DISCOVERY_IN_PROGRESS'
};

/**
 * Initial state for the app
 */
export const initialAppState = {
    view: 'map',
    searchTerm: '',
    allPlaces: [],
    displayedPlaces: [],
    currentLocation: null,
    selectedPlace: null,
    currentLocationId: null,
    locations: [],
    mapState: {
        center: [34.0522, -118.2437],
        zoom: 10,
        bounds: null
    },
    isLoading: true,
    discoveredPlaces: [],
    discoveryInProgress: false
};

/**
 * Reducer function for app state
 */
export const appReducer = (state, action) => {
    switch (action.type) {
        case APP_ACTIONS.SET_VIEW:
            return { ...state, view: action.payload };
        case APP_ACTIONS.SET_SEARCH_TERM:
            return { ...state, searchTerm: action.payload };
        case APP_ACTIONS.SET_ALL_PLACES:
            return { ...state, allPlaces: action.payload };
        case APP_ACTIONS.SET_DISPLAYED_PLACES:
            return { ...state, displayedPlaces: action.payload };
        case APP_ACTIONS.SET_CURRENT_LOCATION:
            return { ...state, currentLocation: action.payload };
        case APP_ACTIONS.SET_SELECTED_PLACE:
            return { ...state, selectedPlace: action.payload };
        case APP_ACTIONS.SET_MAP_STATE:
            return { ...state, mapState: action.payload };
        case APP_ACTIONS.SET_LOCATIONS:
            return { ...state, locations: action.payload };
        case APP_ACTIONS.SET_CURRENT_LOCATION_ID:
            return { ...state, currentLocationId: action.payload };
        case APP_ACTIONS.SET_IS_LOADING:
            return { ...state, isLoading: action.payload };
        case APP_ACTIONS.SET_DISCOVERED_PLACES:
            return { ...state, discoveredPlaces: action.payload };
        case APP_ACTIONS.SET_DISCOVERY_IN_PROGRESS:
            return { ...state, discoveryInProgress: action.payload };
        default:
            return state;
    }
};

/**
 * Custom hook to manage app state with reducer
 */
export const useAppState = () => {
    const [state, dispatch] = useReducer(appReducer, initialAppState);

    const setView = useCallback((view) => {
        dispatch({ type: APP_ACTIONS.SET_VIEW, payload: view });
    }, []);

    const setSearchTerm = useCallback((term) => {
        dispatch({ type: APP_ACTIONS.SET_SEARCH_TERM, payload: term });
    }, []);

    const setAllPlaces = useCallback((places) => {
        dispatch({ type: APP_ACTIONS.SET_ALL_PLACES, payload: places });
    }, []);

    const setDisplayedPlaces = useCallback((places) => {
        dispatch({ type: APP_ACTIONS.SET_DISPLAYED_PLACES, payload: places });
    }, []);

    const setCurrentLocation = useCallback((location) => {
        dispatch({ type: APP_ACTIONS.SET_CURRENT_LOCATION, payload: location });
    }, []);

    const setSelectedPlace = useCallback((place) => {
        dispatch({ type: APP_ACTIONS.SET_SELECTED_PLACE, payload: place });
    }, []);

    const setMapState = useCallback((mapState) => {
        dispatch({ type: APP_ACTIONS.SET_MAP_STATE, payload: mapState });
    }, []);

    const setLocations = useCallback((locations) => {
        dispatch({ type: APP_ACTIONS.SET_LOCATIONS, payload: locations });
    }, []);

    const setCurrentLocationId = useCallback((id) => {
        dispatch({ type: APP_ACTIONS.SET_CURRENT_LOCATION_ID, payload: id });
    }, []);

    const setIsLoading = useCallback((loading) => {
        dispatch({ type: APP_ACTIONS.SET_IS_LOADING, payload: loading });
    }, []);

    const setDiscoveredPlaces = useCallback((places) => {
        dispatch({ type: APP_ACTIONS.SET_DISCOVERED_PLACES, payload: places });
    }, []);

    const setDiscoveryInProgress = useCallback((inProgress) => {
        dispatch({ type: APP_ACTIONS.SET_DISCOVERY_IN_PROGRESS, payload: inProgress });
    }, []);

    return {
        state,
        setView,
        setSearchTerm,
        setAllPlaces,
        setDisplayedPlaces,
        setCurrentLocation,
        setSelectedPlace,
        setMapState,
        setLocations,
        setCurrentLocationId,
        setIsLoading,
        setDiscoveredPlaces,
        setDiscoveryInProgress
    };
};
