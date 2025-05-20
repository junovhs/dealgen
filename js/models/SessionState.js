export class SessionState {
    constructor() {
        this.focus = '';
        this.contextSituation = '';
        this.contextGoal = '';
        this.contextChallenges = '';
        this.questionsPerRound = 4; 
        this.totalTime = 0;
        this.timePerQuestion = 0;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.isPaused = false;
        this.timeRemaining = 0;
        this.timerInterval = null;
        this.ideas = {};
        this.conversationHistory = [];
        this.isGeneratingAiContent = false;
        this.round = 1;
        this.previousRounds = [];
        this.pinnedIdeas = [];
        this.challenges = {};
    }
    
    resetForNewRound() {
        // Store current round data in previous rounds
        this.previousRounds.push({
            round: this.round,
            focus: this.focus,
            contextSituation: this.contextSituation,
            contextGoal: this.contextGoal,
            contextChallenges: this.contextChallenges,
            questions: this.questions,
            ideas: { ...this.ideas },
            challenges: { ...this.challenges }
        });
        
        // Increment round
        this.round++;
        
        // Clear current ideas but keep pinned ideas
        this.ideas = {};
        
        // Clear challenges for next round
        this.challenges = {};
        
        // Reset questions
        this.questions = [];
        
        // Reset current question index
        this.currentQuestionIndex = 0;
    }
    
    getAllIdeasFromPreviousRound() {
        const lastRound = this.previousRounds[this.previousRounds.length - 1];
        if (!lastRound) return [];
        
        // Extract all ideas from the last round
        const allIdeas = [];
        for (const questionKey in lastRound.ideas) {
            if (lastRound.ideas[questionKey] && lastRound.ideas[questionKey].length) {
                allIdeas.push(...lastRound.ideas[questionKey]);
            }
        }
        return allIdeas;
    }
}