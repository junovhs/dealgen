// ===== FILE: dealgen/js/managers/BrainstormPhaseManager.js ===== //
import { ResultsPhaseManager } from './ResultsPhaseManager.js';

export class BrainstormPhaseManager {
    constructor(sessionState, domElements, aiService, timerManager, ideasManager, uiManager) {
        this.sessionState = sessionState;
        this.domElements = domElements;
        this.aiService = aiService; // AIService instance for most AI calls
        this.timerManager = timerManager;
        this.ideasManager = ideasManager;
        this.uiManager = uiManager;
        // Direct API endpoint for the specific "more suggestions" call, if needed, or use aiService's _callApi
        this.apiEndpoint = '/api/generate'; 
    }
    
    /**
     * Helper to call the backend API for generating more suggestions.
     * This leverages the same pattern as AIService._callApi
     */
    async _callApiForMoreSuggestions(payload) {
        try {
            console.log(`BrainstormPhaseManager: Calling ${this.apiEndpoint} for more suggestions with payload:`, JSON.stringify(payload));
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch(e) {
                    errorData = { details: await response.text() || `API request failed with status ${response.status}` };
                }
                console.error('BrainstormPhaseManager: API request failed for suggestions:', errorData);
                throw new Error(errorData.details || `API request for suggestions failed with status ${response.status}`);
            }
            const result = await response.json(); // Expects { content: "JSON_STRING_OF_IDEAS" }
            console.log('BrainstormPhaseManager: Received from API for more suggestions:', result);
            return result; 
        } catch (error) {
            console.error('BrainstormPhaseManager: Error calling backend API for suggestions:', error);
            throw error;
        }
    }
    
    startQuestionTimer() {
        // Ensure questions are loaded
        if (!this.sessionState.questions || this.sessionState.questions.length === 0 || !this.sessionState.questions[this.sessionState.currentQuestionIndex]) {
            console.error("BrainstormPhaseManager: Questions not loaded or current question index is invalid.", this.sessionState);
            this.domElements.currentTopicElement.textContent = `Error: No questions loaded for Round ${this.sessionState.round}.`;
            this.domElements.aiPromptElement.innerHTML = `<p class="question-text">Could not load the next question. Please try starting a new session.</p>`;
            return;
        }

        const currentQuestion = this.sessionState.questions[this.sessionState.currentQuestionIndex];
        this.domElements.currentTopicElement.textContent = `Round ${this.sessionState.round} - Question ${this.sessionState.currentQuestionIndex + 1} of ${this.sessionState.questions.length}`;
        
        this.uiManager.showTypingAnimation();
        setTimeout(() => {
            this.domElements.aiPromptElement.innerHTML = `
                <p class="question-text">${currentQuestion.question}</p>
                <p class="question-explanation">${currentQuestion.explanation}</p>
                <div class="suggestion-pills">
                    ${(currentQuestion.suggestionPills || []).map(pill => 
                        `<button class="suggestion-pill" data-value="${pill}">${pill}</button>`
                    ).join('')}
                    <button id="generate-more-pills" class="generate-more-pills">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                        More ideas
                    </button>
                </div>
            `;
            this.domElements.aiPromptElement.classList.add('active');
            
            this.domElements.aiPromptElement.querySelectorAll('.suggestion-pill').forEach(pill => {
                pill.addEventListener('click', (e) => {
                    const suggestionText = e.target.dataset.value;
                    this.ideasManager.addIdea(suggestionText);
                });
            });
            
            const moreButton = this.domElements.aiPromptElement.querySelector('#generate-more-pills');
            if (moreButton) {
                moreButton.addEventListener('click', () => this.generateMoreSuggestions(currentQuestion));
            }
        }, 1500); // Typing animation delay
        
        this.ideasManager.clearIdeasDisplay();
        this.domElements.ideasInput.value = '';
        this.domElements.ideasInput.focus();
        this.ideasManager.displayCurrentQuestionIdeas();
        
        this.sessionState.timeRemaining = this.sessionState.timePerQuestion;
        this.timerManager.startTimer();
    }
    
    async generateMoreSuggestions(currentQuestion) {
        const moreButton = this.domElements.aiPromptElement.querySelector('#generate-more-pills');
        if (moreButton) {
            moreButton.innerHTML = `<div class="small-spinner"></div> Generating...`;
            moreButton.disabled = true;
            
            try {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced realistic "thinking" delay

                const currentIdeas = currentQuestion.suggestionPills || [];
                const requestPayload = {
                    messages: [
                        { 
                            role: "system", 
                            content: `You're helping with a brainstorming session about "${this.sessionState.focus}".
                            The current question is: "${currentQuestion.question}"
                            Previous suggestion ideas were: ${JSON.stringify(currentIdeas)}.
                            The user wants more ideas because they didn't find these suggestions helpful enough.
                            Generate 3 NEW, more creative and thoughtful suggestion ideas for this question.
                            Each idea should be a complete sentence or phrase (about 8-15 words) that directly answers the question.
                            Be specific, insightful, and potentially unexpected in your answers.
                            Format as JSON array with just the text of each idea.`
                        },
                        { 
                            role: "user", 
                            content: `Generate 3 fresh, thoughtful suggestions for: "${currentQuestion.question}"`
                        }
                    ],
                    json: true // We expect the 'content' from API to be a JSON string (array of ideas)
                };
                
                const apiResponse = await this._callApiForMoreSuggestions(requestPayload);
                const newIdeas = JSON.parse(apiResponse.content); // Parse the JSON string from API's content
                
                const pillsContainer = this.domElements.aiPromptElement.querySelector('.suggestion-pills');
                moreButton.remove(); 
                
                const addPillWithAnimation = (idea, index) => {
                    const pill = document.createElement('button');
                    pill.className = 'suggestion-pill new-pill';
                    pill.dataset.value = idea;
                    pill.style.opacity = '0';
                    pill.style.transform = 'translateX(-5px)';
                    pillsContainer.appendChild(pill);
                    
                    const words = idea.split(' ');
                    let displayedText = '';
                    let wordIndex = 0;
                    
                    const animateNextWord = () => {
                        if (wordIndex < words.length) {
                            displayedText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
                            pill.textContent = displayedText;
                            wordIndex++;
                            setTimeout(animateNextWord, 100); // Faster word animation
                        } else {
                            pill.addEventListener('click', () => {
                                this.ideasManager.addIdea(idea);
                            });
                        }
                    };
                    
                    setTimeout(() => {
                        pill.style.transition = 'opacity 0.3s, transform 0.3s';
                        pill.style.opacity = '1';
                        pill.style.transform = 'translateX(0)';
                        animateNextWord();
                    }, index * 200); // Faster stagger
                };
                
                newIdeas.forEach((idea, index) => {
                    addPillWithAnimation(idea, index);
                });
                
                setTimeout(() => {
                    const newMoreButton = document.createElement('button');
                    newMoreButton.id = 'generate-more-pills';
                    newMoreButton.className = 'generate-more-pills';
                    newMoreButton.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg> More ideas`;
                    newMoreButton.style.opacity = '0';
                    newMoreButton.style.transform = 'translateX(-5px)';
                    pillsContainer.appendChild(newMoreButton);
                    
                    setTimeout(() => {
                        newMoreButton.style.transition = 'opacity 0.3s, transform 0.3s';
                        newMoreButton.style.opacity = '1';
                        newMoreButton.style.transform = 'translateX(0)';
                        newMoreButton.addEventListener('click', () => this.generateMoreSuggestions(currentQuestion));
                    }, 100);
                }, newIdeas.length * 200 + 150);
                
                currentQuestion.suggestionPills = [...(currentQuestion.suggestionPills || []), ...newIdeas];
                
            } catch (error) {
                console.error('Error generating more suggestions:', error);
                // Restore button if it exists or re-create it if it was removed
                let existingMoreButton = this.domElements.aiPromptElement.querySelector('#generate-more-pills');
                if (!existingMoreButton) {
                    const pillsContainer = this.domElements.aiPromptElement.querySelector('.suggestion-pills');
                    if (pillsContainer) {
                        existingMoreButton = document.createElement('button');
                        existingMoreButton.id = 'generate-more-pills';
                        existingMoreButton.className = 'generate-more-pills';
                        pillsContainer.appendChild(existingMoreButton);
                        existingMoreButton.addEventListener('click', () => this.generateMoreSuggestions(currentQuestion));
                    }
                }
                if (existingMoreButton) {
                    existingMoreButton.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg> More ideas (Error)`;
                    existingMoreButton.disabled = false;
                }
                 // Optionally, display a user-friendly error message in the UI
                const errorDisplay = document.createElement('p');
                errorDisplay.textContent = 'Could not generate more suggestions at this time.';
                errorDisplay.style.color = 'red';
                this.domElements.aiPromptElement.appendChild(errorDisplay);
                setTimeout(() => errorDisplay.remove(), 5000);
            }
        }
    }
    
    async skipToNextQuestion() {
        this.timerManager.stopTimer();
        
        // Generate AI review (uses AIService which now calls /api/generate)
        const reviewText = await this.aiService.generateAiQuestionReview();
        if (reviewText) {
            this.domElements.aiProgressComment.innerHTML = reviewText;
        }
        
        this.sessionState.currentQuestionIndex++;
        
        if (this.sessionState.currentQuestionIndex < this.sessionState.questions.length) {
            this.startQuestionTimer();
        } else {
            await this.finishSession();
        }
    }
    
    async finishSession() {
        this.uiManager.switchToResultsPhase();
        
        const resultsPhaseManager = new ResultsPhaseManager(
            this.sessionState, 
            this.domElements, 
            this.aiService, // AIService is passed, which uses the correct API
            this.uiManager
        );
        
        await resultsPhaseManager.displayResults();
    }
}
// ===== END dealgen/js/managers/BrainstormPhaseManager.js ===== //