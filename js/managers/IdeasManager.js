export class IdeasManager {
    constructor(sessionState, domElements, uiManager) {
        this.sessionState = sessionState;
        this.domElements = domElements;
        this.uiManager = uiManager;
    }
    
    addIdea(idea) {
        if (!idea.trim()) return;
        
        const questionKey = `question_${this.sessionState.currentQuestionIndex}`;
        if (!this.sessionState.ideas[questionKey]) {
            this.sessionState.ideas[questionKey] = [];
        }
        
        if (!this.sessionState.ideas[questionKey].includes(idea)) {
            this.sessionState.ideas[questionKey].push(idea);
            this.addIdeaToList(idea);
        }
    }
    
    addIdeaToList(idea) {
        const li = document.createElement('li');
        
        // Create idea content container
        const ideaContainer = document.createElement('div');
        ideaContainer.className = 'idea-content';
        
        // Add idea text
        const ideaText = document.createElement('span');
        ideaText.textContent = idea;
        ideaContainer.appendChild(ideaText);
        
        // Create challenge button
        const challengeBtn = document.createElement('button');
        challengeBtn.className = 'challenge-btn';
        challengeBtn.innerHTML = 'But actually...';
        challengeBtn.addEventListener('click', (e) => {
            const challengeInput = li.querySelector('.challenge-input');
            if (challengeInput) {
                challengeInput.classList.toggle('hidden');
                challengeInput.focus();
            } else {
                this.addChallengeInput(li, idea);
            }
        });
        ideaContainer.appendChild(challengeBtn);
        
        // Create pin button
        const pinButton = document.createElement('button');
        pinButton.className = 'pin-idea-btn';
        pinButton.innerHTML = '📌 Pin';
        pinButton.addEventListener('click', () => {
            if (!this.sessionState.pinnedIdeas.includes(idea)) {
                this.sessionState.pinnedIdeas.push(idea);
                this.uiManager.updatePinnedIdeasDisplay(this.sessionState);
                pinButton.disabled = true;
                pinButton.innerHTML = '📌 Pinned';
            }
        });
        
        // Add containers to list item
        li.appendChild(ideaContainer);
        li.appendChild(pinButton);
        
        // If idea is already pinned, disable the pin button
        if (this.sessionState.pinnedIdeas.includes(idea)) {
            pinButton.disabled = true;
            pinButton.innerHTML = '📌 Pinned';
        }
        
        this.domElements.ideasList.appendChild(li);
        this.domElements.ideasList.scrollTop = this.domElements.ideasList.scrollHeight;
    }
    
    addChallengeInput(listItem, idea) {
        const questionKey = `question_${this.sessionState.currentQuestionIndex}`;
        
        // Create challenge input container
        const challengeContainer = document.createElement('div');
        challengeContainer.className = 'challenge-input';
        
        // Create challenge textarea
        const challengeTextarea = document.createElement('textarea');
        challengeTextarea.placeholder = 'What challenges or issues might this idea face?';
        challengeContainer.appendChild(challengeTextarea);
        
        // Create save button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-challenge-btn';
        saveBtn.innerHTML = 'Save';
        saveBtn.addEventListener('click', () => {
            const challengeText = challengeTextarea.value.trim();
            if (challengeText) {
                // Save challenge to the idea
                if (!this.sessionState.challenges) {
                    this.sessionState.challenges = {};
                }
                
                if (!this.sessionState.challenges[questionKey]) {
                    this.sessionState.challenges[questionKey] = {};
                }
                
                this.sessionState.challenges[questionKey][idea] = challengeText;
                
                // Create and display challenge text
                const challengeDisplay = document.createElement('div');
                challengeDisplay.className = 'challenge-text';
                challengeDisplay.innerHTML = `<strong>Challenge:</strong> ${challengeText}`;
                
                // Replace input with display
                listItem.appendChild(challengeDisplay);
                challengeContainer.remove();
            } else {
                challengeContainer.remove();
            }
        });
        challengeContainer.appendChild(saveBtn);
        
        listItem.appendChild(challengeContainer);
        challengeTextarea.focus();
    }
    
    clearIdeasDisplay() {
        this.domElements.ideasList.innerHTML = '';
    }
    
    displayCurrentQuestionIdeas() {
        this.clearIdeasDisplay();
        const questionKey = `question_${this.sessionState.currentQuestionIndex}`;
        if (this.sessionState.ideas[questionKey]) {
            this.sessionState.ideas[questionKey].forEach(idea => {
                this.addIdeaToList(idea);
            });
        }
    }
    
    handleIdeaSubmit(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const idea = this.domElements.ideasInput.value.trim();
            if (idea) {
                this.addIdea(idea);
                this.domElements.ideasInput.value = '';
            }
        }
    }
}