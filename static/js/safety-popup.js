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
            modal.classList.add('active');
            this.currentSlide = 1;
            this.showSlide(1);
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
            const questionItem = document.createElement('div');
            questionItem.className = 'question-item';
            questionItem.dataset.questionId = index + 1;

            const questionText = document.createElement('div');
            questionText.className = 'question-text';
            questionText.innerHTML = `<span class="question-number">${index + 1}.</span>${question}`;

            const answersDiv = document.createElement('div');
            answersDiv.className = 'question-answers';

            // Answer type toggle buttons
            const answerTypeDiv = document.createElement('div');
            answerTypeDiv.className = 'answer-type-selector';
            
            const yesNoBtn = document.createElement('button');
            yesNoBtn.type = 'button';
            yesNoBtn.className = 'answer-type-btn active';
            yesNoBtn.textContent = 'Yes/No';
            yesNoBtn.dataset.type = 'yesno';
            
            const textBtn = document.createElement('button');
            textBtn.type = 'button';
            textBtn.className = 'answer-type-btn';
            textBtn.textContent = 'Text Response';
            textBtn.dataset.type = 'text';

            answerTypeDiv.appendChild(yesNoBtn);
            answerTypeDiv.appendChild(textBtn);

            // Yes/No buttons container
            const yesNoContainer = document.createElement('div');
            yesNoContainer.className = 'yes-no-container';

            // Yes button
            const yesBtn = document.createElement('button');
            yesBtn.type = 'button';
            yesBtn.className = 'answer-btn';
            yesBtn.dataset.answer = 'yes';
            yesBtn.textContent = 'Yes';
            yesBtn.addEventListener('click', () => {
                this.selectAnswer(index + 1, 'yes', yesBtn, noBtn);
                textInput.style.display = 'none';
                yesNoContainer.style.display = 'flex';
            });

            // No button
            const noBtn = document.createElement('button');
            noBtn.type = 'button';
            noBtn.className = 'answer-btn';
            noBtn.dataset.answer = 'no';
            noBtn.textContent = 'No';
            noBtn.addEventListener('click', () => {
                this.selectAnswer(index + 1, 'no', yesBtn, noBtn);
                textInput.style.display = 'none';
                yesNoContainer.style.display = 'flex';
            });

            yesNoContainer.appendChild(yesBtn);
            yesNoContainer.appendChild(noBtn);

            // Text input container
            const textContainer = document.createElement('div');
            textContainer.className = 'text-input-container';
            textContainer.style.display = 'none';

            const textInput = document.createElement('textarea');
            textInput.className = 'answer-text-input';
            textInput.placeholder = 'Enter your response here...';
            textInput.rows = 3;
            textInput.addEventListener('input', () => {
                if (textInput.value.trim()) {
                    this.questionnaireAnswers[index + 1] = textInput.value.trim();
                    console.log(`Question ${index + 1} answered with text: ${textInput.value.trim()}`);
                }
            });

            textContainer.appendChild(textInput);

            // Answer type toggle handlers
            yesNoBtn.addEventListener('click', () => {
                yesNoBtn.classList.add('active');
                textBtn.classList.remove('active');
                yesNoContainer.style.display = 'flex';
                textContainer.style.display = 'none';
                delete this.questionnaireAnswers[index + 1];
            });

            textBtn.addEventListener('click', () => {
                textBtn.classList.add('active');
                yesNoBtn.classList.remove('active');
                yesNoContainer.style.display = 'none';
                textContainer.style.display = 'block';
                yesBtn.classList.remove('selected');
                noBtn.classList.remove('selected');
                if (textInput.value.trim()) {
                    this.questionnaireAnswers[index + 1] = textInput.value.trim();
                }
            });

            answersDiv.appendChild(answerTypeDiv);
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
        
        // Update answer data
        this.questionnaireAnswers[questionNum] = answer;

        // Update button styles
        yesBtn.classList.remove('selected');
        noBtn.classList.remove('selected');
        
        if (answer === 'yes') {
            yesBtn.classList.add('selected');
        } else {
            noBtn.classList.add('selected');
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
        
        // First, collect all text inputs that are visible and have content
        const textInputs = document.querySelectorAll('.answer-text-input');
        textInputs.forEach((input, index) => {
            const questionId = index + 1;
            const textContainer = input.closest('.text-input-container');
            if (textContainer && textContainer.style.display !== 'none' && input.value.trim()) {
                this.questionnaireAnswers[questionId] = input.value.trim();
            }
        });
        
        // Count answered questions
        const answeredQuestions = Object.keys(this.questionnaireAnswers).length;

        console.log(`Total questions: ${totalQuestions}, Answered: ${answeredQuestions}`);
        console.log('Questionnaire answers:', this.questionnaireAnswers);

        if (answeredQuestions < totalQuestions) {
            alert(`Please answer all ${totalQuestions} questions before submitting.`);
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
            const evaluationData = {
                zipcode: this.zipcode,
                answers: this.questionnaireAnswers,
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

