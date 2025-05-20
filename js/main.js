import { SessionState } from './models/SessionState.js';
import { DOMElements } from './utils/DOMElements.js';
import { UIManager } from './ui/UIManager.js';
import { AIService } from './services/AIService.js';
import { TimerManager } from './utils/TimerManager.js';
import { IdeasManager } from './managers/IdeasManager.js';
import { EventListeners } from './managers/EventListeners.js';
import { SetupPhaseManager } from './managers/SetupPhaseManager.js';
import { BrainstormPhaseManager } from './managers/BrainstormPhaseManager.js';
import { ResultsPhaseManager } from './managers/ResultsPhaseManager.js';
import { ExportManager } from './utils/ExportManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize core modules
    const sessionState = new SessionState();
    const domElements = new DOMElements();
    const uiManager = new UIManager(domElements);
    const aiService = new AIService(sessionState);
    const timerManager = new TimerManager(sessionState, domElements, uiManager);
    const ideasManager = new IdeasManager(sessionState, domElements, uiManager);
    
    // Initialize phase managers
    const setupPhaseManager = new SetupPhaseManager(
        sessionState, 
        domElements, 
        aiService, 
        uiManager
    );
    
    const brainstormPhaseManager = new BrainstormPhaseManager(
        sessionState, 
        domElements, 
        aiService, 
        timerManager, 
        ideasManager,
        uiManager
    );
    
    const resultsPhaseManager = new ResultsPhaseManager(
        sessionState, 
        domElements, 
        aiService, 
        uiManager
    );
    
    const exportManager = new ExportManager(sessionState, domElements);
    
    // Initialize event listeners
    const eventListeners = new EventListeners(
        sessionState,
        domElements,
        setupPhaseManager,
        brainstormPhaseManager,
        resultsPhaseManager,
        timerManager,
        ideasManager,
        exportManager
    );
    
    // Start the application
    eventListeners.initializeApp();
});