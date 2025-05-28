export class DOMElements {
    constructor() {
        // Phase containers
        this.setupPhase = document.getElementById('setup-phase');
        this.brainstormPhase = document.getElementById('brainstorm-phase');
        this.resultsPhase = document.getElementById('results-phase');
        
        // Session progress and pinned ideas
        this.sessionProgressBanner = document.getElementById('session-progress');
        this.pinnedIdeasContainer = document.getElementById('pinned-ideas-container');
        this.pinnedIdeasList = document.getElementById('pinned-ideas');
        this.aiProgressComment = document.getElementById('ai-progress-comment');
        this.currentRoundSpan = document.getElementById('current-round');
        this.iterationNotice = document.getElementById('iteration-notice');
        this.setupRoundNumber = document.getElementById('setup-round-number');
        this.allRoundsContainer = document.getElementById('all-rounds-results');
        
        // Setup phase elements
        this.contextSituation = document.getElementById('context-situation');
        this.contextGoal = document.getElementById('context-goal');
        this.contextChallenges = document.getElementById('context-challenges');
        this.questionsPerRound = document.getElementById('questions-per-round');
        this.timeAvailable = document.getElementById('time-available');
        this.customTimeContainer = document.getElementById('custom-time-container');
        this.customTime = document.getElementById('custom-time');
        this.startSessionBtn = document.getElementById('start-session');
        this.aiLoading = document.getElementById('ai-loading');
        this.logo = document.querySelector('.logo'); // Added logo element

        // Brainstorm phase elements
        this.timerElement = document.getElementById('timer');
        this.pauseTimerBtn = document.getElementById('pause-timer');
        this.nextQuestionBtn = document.getElementById('next-question');
        this.currentTopicElement = document.getElementById('current-topic');
        this.aiPromptElement = document.getElementById('ai-prompt');
        this.ideasInput = document.getElementById('ideas-input');
        this.ideasList = document.getElementById('ideas-list');
        this.progressBar = document.querySelector('.progress');
        this.continueSessionBtn = document.getElementById('continue-session');
        
        // Results phase elements
        this.aiAnalysis = document.getElementById('ai-analysis');
        this.copyResultsBtn = document.getElementById('copy-results');
        this.downloadResultsBtn = document.getElementById('download-results');
        this.newSessionBtn = document.getElementById('new-session');
    }
}