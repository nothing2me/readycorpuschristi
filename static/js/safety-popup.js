/**
 * Safety Evaluation Popup Manager
 * Handles popup modal, slide navigation, and questionnaire data collection
 */

class SafetyPopupManager {
    constructor() {
        this.currentSlide = 1;
        this.zipcode = '';
        this.questionnaireAnswers = {};
        this.isProcessingNo = false;
        this.isProcessingSubmit = false;
        this.questions = [
            "Do you have emergency contacts readily available?",
            "Are you familiar with evacuation routes in your area?",
            "Do you have an emergency preparedness kit?",
            "Are you aware of local emergency services contact numbers?",
            "Do you have a plan for communication during emergencies?",
            "Are you prepared for natural disasters common in your area?",
            "Do you have important documents secured and accessible?",
            "Are you aware of community emergency resources?",
            "Do you have backup power sources (battery packs, generators)?",
            "Have you discussed emergency plans with family/household members?"
        ];
        
        // Questions that should show text input when "Yes" is clicked (1-indexed)
        this.questionsWithDetails = [1, 3, 5, 7, 9]; // Questions 1, 3, 5, 7, 9 need details
        
        // Valid Corpus Christi zip codes
        this.validZipCodes = [
            '78401', '78402', '78403', '78404', '78405', '78406', '78407', '78408', '78409', '78410',
            '78411', '78412', '78413', '78414', '78415', '78416', '78417', '78418', '78419', '78426',
            '78427', '78460', '78461', '78463', '78465', '78466', '78467', '78468', '78469', '78470',
            '78471', '78472', '78473', '78474', '78475', '78476', '78477', '78478', '78480'
        ];
        
        this.init();
    }

    init() {
        // Show popup on page load
        this.showPopup();
        
        // Initialize event listeners
        this.setupEventListeners();
        
        // Generate questionnaire questions
        this.generateQuestions();
    }

    showPopup() {
        const modal = document.getElementById('safety-popup-modal');
        if (modal) {
            // Add active class to show modal
            modal.classList.add('active');
            this.currentSlide = 1;
            this.showSlide(1);
            
            // Trigger animation after a small delay to ensure the modal is displayed
            // Use setTimeout to ensure the display: flex change has been applied
            setTimeout(() => {
                const popupContent = modal.querySelector('.popup-content');
                if (popupContent) {
                    // Trigger reflow to start animation
                    popupContent.offsetHeight;
                }
            }, 10);
        }
    }

    hidePopup() {
        const modal = document.getElementById('safety-popup-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showSlide(slideNumber) {
        // Hide all slides
        const slides = document.querySelectorAll('.popup-slide');
        slides.forEach(slide => {
            slide.style.display = 'none';
        });

        // Show target slide
        const targetSlide = document.getElementById(`slide-${slideNumber}`);
        if (targetSlide) {
            targetSlide.style.display = 'block';
            this.currentSlide = slideNumber;
        }
    }

    validateZipCode(zipcode) {
        const trimmedZip = zipcode.trim();
        if (!trimmedZip) {
            return { valid: false, message: 'Please enter a zipcode before continuing.' };
        }
        
        if (!this.validZipCodes.includes(trimmedZip)) {
            return { 
                valid: false, 
                message: `Error: Zip code ${trimmedZip} is not a valid Corpus Christi zip code. Please enter a valid zip code.` 
            };
        }
        
        return { valid: true, message: '' };
    }

    showZipCodeError(message) {
        // Remove any existing error message
        this.hideZipCodeError();
        
        // Create error message element
        const zipcodeInput = document.getElementById('zipcode-input');
        if (!zipcodeInput) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.id = 'zipcode-error';
        errorDiv.className = 'zipcode-error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#ff0000';
        errorDiv.style.fontSize = '14px';
        errorDiv.style.marginTop = '8px';
        errorDiv.style.fontWeight = '500';
        
        // Add error styling to input
        zipcodeInput.style.borderColor = '#ff0000';
        zipcodeInput.style.borderWidth = '2px';
        
        // Insert error message after input
        zipcodeInput.parentNode.insertBefore(errorDiv, zipcodeInput.nextSibling);
    }

    hideZipCodeError() {
        const errorDiv = document.getElementById('zipcode-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        
        // Reset input styling
        const zipcodeInput = document.getElementById('zipcode-input');
        if (zipcodeInput) {
            zipcodeInput.style.borderColor = '';
            zipcodeInput.style.borderWidth = '';
        }
    }

    setupEventListeners() {
        // Yes button - show questionnaire
        const yesBtn = document.getElementById('yes-questionnaire-btn');
        if (yesBtn) {
            yesBtn.addEventListener('click', () => {
                const zipcodeInput = document.getElementById('zipcode-input');
                if (zipcodeInput && zipcodeInput.value.trim()) {
                    const validation = this.validateZipCode(zipcodeInput.value);
                    if (validation.valid) {
                        this.hideZipCodeError();
                        this.zipcode = zipcodeInput.value.trim();
                        this.showSlide(2);
                    } else {
                        this.showZipCodeError(validation.message);
                    }
                } else {
                    this.showZipCodeError('Please enter a zipcode before continuing.');
                }
            });
        }

        // No button - send general safety info request
        const noBtn = document.getElementById('no-questionnaire-btn');
        if (noBtn) {
            noBtn.addEventListener('click', () => {
                const zipcodeInput = document.getElementById('zipcode-input');
                if (zipcodeInput && zipcodeInput.value.trim()) {
                    const validation = this.validateZipCode(zipcodeInput.value);
                    if (validation.valid) {
                        this.hideZipCodeError();
                        this.zipcode = zipcodeInput.value.trim();
                        this.handleNoQuestionnaire();
                    } else {
                        this.showZipCodeError(validation.message);
                    }
                } else {
                    this.showZipCodeError('Please enter a zipcode before continuing.');
                }
            });
        }
        
        // Clear error on input change
        const zipcodeInput = document.getElementById('zipcode-input');
        if (zipcodeInput) {
            zipcodeInput.addEventListener('input', () => {
                this.hideZipCodeError();
            });
        }

        // Done button - submit questionnaire
        const doneBtn = document.getElementById('done-questionnaire-btn');
        if (doneBtn) {
            doneBtn.addEventListener('click', () => {
                this.handleQuestionnaireSubmit();
            });
        }

        // Close button
        const closeBtn = document.getElementById('close-popup-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hidePopup();
            });
        }

        // Close on background click
        const modal = document.getElementById('safety-popup-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    // Only allow closing if on slide 2 (questionnaire can be closed)
                    if (this.currentSlide === 2) {
                        this.hidePopup();
                    }
                }
            });
        }
    }

    generateQuestions() {
        const questionsContainer = document.getElementById('questionnaire-questions');
        if (!questionsContainer) return;

        questionsContainer.innerHTML = '';

        this.questions.forEach((question, index) => {
            const questionId = index + 1;
            const questionItem = document.createElement('div');
            questionItem.className = 'question-item';
            questionItem.dataset.questionId = questionId;

            const questionText = document.createElement('div');
            questionText.className = 'question-text';
            questionText.innerHTML = `<span class="question-number">${questionId}.</span>${question}`;

            const answersDiv = document.createElement('div');
            answersDiv.className = 'question-answers';

            // Yes/No buttons container
            const yesNoContainer = document.createElement('div');
            yesNoContainer.className = 'yes-no-container';

            // Yes button
            const yesBtn = document.createElement('button');
            yesBtn.type = 'button';
            yesBtn.className = 'answer-btn';
            yesBtn.dataset.answer = 'yes';
            yesBtn.textContent = 'Yes';

            // No button
            const noBtn = document.createElement('button');
            noBtn.type = 'button';
            noBtn.className = 'answer-btn';
            noBtn.dataset.answer = 'no';
            noBtn.textContent = 'No';

            // Text input container (only shown when Yes is clicked on relevant questions)
            const textContainer = document.createElement('div');
            textContainer.className = 'text-input-container';
            textContainer.style.display = 'none';

            const textInputLabel = document.createElement('label');
            textInputLabel.className = 'text-input-label';
            textInputLabel.textContent = 'List them.';
            textInputLabel.style.display = 'block';
            textInputLabel.style.marginTop = '10px';
            textInputLabel.style.marginBottom = '5px';
            textInputLabel.style.fontSize = '14px';
            textInputLabel.style.fontWeight = '500';
            textInputLabel.style.color = '#000000';

            const textInput = document.createElement('textarea');
            textInput.className = 'answer-text-input';
            textInput.id = `text-input-${questionId}`;
            textInput.placeholder = 'Enter your details here...';
            textInput.rows = 3;
            
            textInput.addEventListener('input', () => {
                // Store both yes answer and text details
                if (textInput.value.trim()) {
                    this.questionnaireAnswers[questionId] = {
                        answer: 'yes',
                        details: textInput.value.trim()
                    };
                } else if (this.questionnaireAnswers[questionId] && this.questionnaireAnswers[questionId].answer === 'yes') {
                    // Keep yes but remove details if text is cleared
                    this.questionnaireAnswers[questionId] = 'yes';
                }
            });

            textContainer.appendChild(textInputLabel);
            textContainer.appendChild(textInput);

            // Check if this question should show text input when Yes is clicked
            const shouldShowTextInput = this.questionsWithDetails.includes(questionId);

            // Yes button click handler
            yesBtn.addEventListener('click', () => {
                this.selectAnswer(questionId, 'yes', yesBtn, noBtn);
                
                // Show text input if this question needs details
                if (shouldShowTextInput) {
                    textContainer.style.display = 'block';
                    textInput.focus();
                } else {
                    textContainer.style.display = 'none';
                }
            });

            // No button click handler
            noBtn.addEventListener('click', () => {
                this.selectAnswer(questionId, 'no', yesBtn, noBtn);
                textContainer.style.display = 'none';
                textInput.value = ''; // Clear text when No is selected
            });

            yesNoContainer.appendChild(yesBtn);
            yesNoContainer.appendChild(noBtn);

            answersDiv.appendChild(yesNoContainer);
            answersDiv.appendChild(textContainer);

            questionItem.appendChild(questionText);
            questionItem.appendChild(answersDiv);
            questionsContainer.appendChild(questionItem);
        });
    }

    selectAnswer(questionId, answer, yesBtn, noBtn) {
        // Ensure questionId is a number
        const questionNum = parseInt(questionId);
        
        // Update button styles
        yesBtn.classList.remove('selected');
        noBtn.classList.remove('selected');
        
        if (answer === 'yes') {
            yesBtn.classList.add('selected');
            // If there's already text details, preserve them
            if (this.questionnaireAnswers[questionNum] && typeof this.questionnaireAnswers[questionNum] === 'object' && this.questionnaireAnswers[questionNum].details) {
                // Keep the object with details
            } else {
                // Set to yes, text input will update if user types
                this.questionnaireAnswers[questionNum] = 'yes';
            }
        } else {
            noBtn.classList.add('selected');
            // Clear any details when No is selected
            this.questionnaireAnswers[questionNum] = 'no';
        }
        
        console.log(`Question ${questionNum} answered: ${answer}`);
        console.log('Current answers:', this.questionnaireAnswers);
    }

    async handleNoQuestionnaire() {
        // Prevent multiple simultaneous requests
        if (this.isProcessingNo) {
            return;
        }
        this.isProcessingNo = true;
        
        // Hide popup
        this.hidePopup();

        // Send general safety info request to chatbot
        if (window.chatbotManager) {
            const verifiedContacts = `VERIFIED EMERGENCY CONTACT INFORMATION FOR CORPUS CHRISTI:

IMPORTANT: Use these VERIFIED phone numbers exactly as provided. All numbers are accurate and verified.

EMERGENCY SERVICES:
- Emergency Services (Police, Fire, Medical): 911 (Use for immediate life-threatening situations)

LOCAL SERVICES:
- Corpus Christi Police Department (Non-Emergency): (361) 886-2600
- Corpus Christi Fire Department (Non-Emergency HQ): (361) 826-3900
- City of Corpus Christi Services (311/Landline): (361) 826-2489 (For general non-emergency city service requests)
- Corpus Christi Office of Emergency Management (OEM): (361) 826-3900

DISASTER RELIEF:
- American Red Cross (Coastal Bend Chapter): 1-800-RED-CROSS (733-2767) - General disaster assistance hotline (24 hours a day)
- Salvation Army (Corpus Christi): (361) 884-9497 - Administrative and social services office

FOOD ASSISTANCE:
- Coastal Bend Food Bank: (361) 887-6291

WEATHER INFORMATION:
- National Weather Service (Corpus Christi): (361) 289-0959 (Main office number)

FEDERAL AID:
- FEMA (Disaster Assistance Helpline): 1-800-621-3362 (For applying for federal disaster assistance)

COMMUNITY SERVICES:
- 2-1-1 Texas (Health/Social Services): 211 or 1-877-541-7905 (Statewide referral service)

MENTAL HEALTH:
- Disaster Distress Helpline (SAMHSA): 1-800-985-5990 (For emotional distress related to disasters)`;

            const message = `Please provide general safety information for zipcode ${this.zipcode} in Corpus Christi. Include information about emergency preparedness, local emergency services, and relevant safety resources for this area. 

${verifiedContacts}

CRITICAL: When providing phone numbers, use ONLY the verified numbers listed above. Do NOT invent or modify phone numbers. All contact information must be 100% accurate.`;
            
            // Show loading in chatbot
            const loadingId = window.chatbotManager.addLoadingMessage();
            
            try {
                const response = await fetch('/api/chatbot/message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message,
                        context: {
                            zipcode: this.zipcode,
                            type: 'general_safety_info'
                        }
                    })
                });

                const data = await response.json();
                window.chatbotManager.removeMessage(loadingId);

                if (data.status === 'success') {
                    window.chatbotManager.addBotMessage(data.response);
                } else {
                    window.chatbotManager.addBotMessage(`Sorry, I encountered an error: ${data.error}`, true);
                }
            } catch (error) {
                window.chatbotManager.removeMessage(loadingId);
                window.chatbotManager.addBotMessage(`Error: ${error.message}`, true);
            } finally {
                this.isProcessingNo = false;
            }
        } else {
            this.isProcessingNo = false;
        }
    }

    async handleQuestionnaireSubmit() {
        // Prevent multiple simultaneous submissions
        if (this.isProcessingSubmit) {
            return;
        }
        this.isProcessingSubmit = true;
        
        // Collect all answers including text inputs
        const totalQuestions = this.questions.length;
        
        // Collect all text inputs that are visible and have content
        const textInputs = document.querySelectorAll('.answer-text-input');
        textInputs.forEach((input) => {
            const questionId = parseInt(input.id.replace('text-input-', ''));
            const textContainer = input.closest('.text-input-container');
            if (textContainer && textContainer.style.display !== 'none' && input.value.trim()) {
                // Update answer to include details
                if (this.questionnaireAnswers[questionId] === 'yes' || !this.questionnaireAnswers[questionId]) {
                    this.questionnaireAnswers[questionId] = {
                        answer: 'yes',
                        details: input.value.trim()
                    };
                } else if (typeof this.questionnaireAnswers[questionId] === 'object') {
                    this.questionnaireAnswers[questionId].details = input.value.trim();
                }
            }
        });
        
        // Count answered questions (including yes/no answers even without text details)
        let answeredQuestions = 0;
        for (let i = 1; i <= totalQuestions; i++) {
            if (this.questionnaireAnswers[i]) {
                const answer = this.questionnaireAnswers[i];
                // Count if it's 'yes', 'no', or an object with answer property
                if (answer === 'yes' || answer === 'no' || (typeof answer === 'object' && answer.answer)) {
                    answeredQuestions++;
                }
            }
        }

        console.log(`Total questions: ${totalQuestions}, Answered: ${answeredQuestions}`);
        console.log('Questionnaire answers:', this.questionnaireAnswers);

        if (answeredQuestions < totalQuestions) {
            alert(`Please answer all ${totalQuestions} questions before submitting.`);
            this.isProcessingSubmit = false;
            return;
        }

        // Check if chatbotManager is available
        if (!window.chatbotManager) {
            console.error('ChatbotManager is not available!');
            alert('Chatbot is not initialized. Please refresh the page.');
            return;
        }

        // Hide popup
        this.hidePopup();

        // Send evaluation data to chatbot
        if (window.chatbotManager) {
            // Prepare answers for backend (normalize format)
            // For answers with details: send as text string with yes answer included
            // Format: "yes: details text" or just "yes" or "no"
            const answersForBackend = {};
            Object.keys(this.questionnaireAnswers).forEach(key => {
                const answer = this.questionnaireAnswers[key];
                if (typeof answer === 'object' && answer.answer) {
                    // If there are details, format as "yes: details"
                    if (answer.details) {
                        answersForBackend[key] = `yes: ${answer.details}`;
                    } else {
                        answersForBackend[key] = answer.answer;
                    }
                } else {
                    answersForBackend[key] = answer;
                }
            });
            
            const evaluationData = {
                zipcode: this.zipcode,
                answers: answersForBackend,
                questions: this.questions
            };

            // Show loading in chatbot
            const loadingId = window.chatbotManager.addLoadingMessage();

            try {
                console.log('Submitting evaluation data:', evaluationData);
                
                const response = await fetch('/api/chatbot/safety-evaluation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        evaluation_data: evaluationData
                    })
                });

                console.log('Response status:', response.status);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Response data:', data);
                
                window.chatbotManager.removeMessage(loadingId);

                if (data.status === 'success') {
                    console.log('Adding bot message:', data.response);
                    // Store metadata for PDF download
                    const metadata = {
                        isSafetyEvaluation: true,
                        response: data.response,
                        zipcode: evaluationData.zipcode,
                        stats: data.stats || {},
                        evaluation_data: evaluationData
                    };
                    window.chatbotManager.addBotMessage(data.response, false, metadata);
                } else {
                    window.chatbotManager.addBotMessage(`Sorry, I encountered an error: ${data.error || 'Unknown error'}`, true);
                }
            } catch (error) {
                console.error('Error submitting evaluation:', error);
                window.chatbotManager.removeMessage(loadingId);
                window.chatbotManager.addBotMessage(`Error: ${error.message}`, true);
            }
        }
    }

    getEvaluationData() {
        return {
            zipcode: this.zipcode,
            answers: this.questionnaireAnswers,
            questions: this.questions
        };
    }
}

// Initialize on page load (after a small delay to ensure chatbotManager is ready)
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure other managers are initialized
    setTimeout(() => {
        if (!window.chatbotManager) {
            console.warn('ChatbotManager not yet available, retrying...');
            // Try again after a short delay
            setTimeout(() => {
                window.safetyPopupManager = new SafetyPopupManager();
            }, 500);
        } else {
            window.safetyPopupManager = new SafetyPopupManager();
        }
    }, 100);
});

