"""
Safety Evaluation Prompt Template
Creates structured prompts for safety evaluation based on questionnaire responses
"""

from typing import Dict, List, Any

class SafetyEvaluationTemplate:
    """Template for generating safety evaluation prompts from questionnaire data"""
    
    @staticmethod
    def generate_prompt(evaluation_data: Dict[str, Any]) -> str:
        """
        Generate a comprehensive safety evaluation prompt from questionnaire data.
        
        Args:
            evaluation_data: Dictionary containing:
                - zipcode: str
                - answers: Dict[int, str] - question_id -> 'yes'/'no'
                - questions: List[str] - list of questions
        
        Returns:
            Formatted prompt string for AI chatbot
        """
        zipcode = evaluation_data.get('zipcode', 'Unknown')
        answers = evaluation_data.get('answers', {})
        questions = evaluation_data.get('questions', [])
        
        # Calculate statistics
        total_questions = len(questions)
        answered_count = len(answers)
        yes_count = sum(1 for ans in answers.values() if isinstance(ans, str) and ans == 'yes')
        no_count = sum(1 for ans in answers.values() if isinstance(ans, str) and ans == 'no')
        text_entries_count = sum(1 for ans in answers.values() if isinstance(ans, str) and ans not in ['yes', 'no', 'not answered'])
        not_answered_count = total_questions - answered_count
        
        # Calculate preparedness score (1-10)
        # Score based on: yes answers = +1 point each, no answers = 0 points, text entries = partial credit (0.5)
        score = 0
        max_score = total_questions
        if answered_count > 0:
            score = (yes_count * 1.0) + (text_entries_count * 0.5)
            # Normalize to 1-10 scale: (score / max_score) * 9 + 1 to ensure range is 1-10
            # This maps: 0% -> 1, 50% -> 5.5, 100% -> 10
            normalized_score = max(1, min(10, round((score / max_score) * 9 + 1)))
        else:
            normalized_score = 1  # Minimum score if nothing answered
        
        # Identify specific areas of concern
        areas_concern = []
        strengths = []
        text_responses = []
        
        for idx, question in enumerate(questions, start=1):
            answer = answers.get(idx, 'not answered')
            if answer == 'yes':
                strengths.append(f"Question {idx}: {question}")
            elif answer == 'no':
                areas_concern.append(f"Question {idx}: {question}")
            elif isinstance(answer, str) and answer not in ['yes', 'no', 'not answered']:
                text_responses.append(f"Question {idx}: {question}\n   Response: {answer}")
        
        # Build concise prompt with scoring
        prompt_parts = [
            f"Provide a focused safety assessment for zipcode {zipcode} in Corpus Christi, Texas.",
            "",
            "PREPAREDNESS SCORE:",
            f"- Overall Preparedness Score: {normalized_score}/10",
            f"  (Based on {yes_count} fully prepared areas, {text_entries_count} partially prepared areas, {no_count} areas needing attention)",
            "",
            "QUESTIONNAIRE SUMMARY:",
            f"- Total questions: {total_questions}",
            f"- Answered: {answered_count}",
            f"- Strengths (Yes): {yes_count}",
            f"- Partial Responses (Text): {text_entries_count}",
            f"- Areas needing attention (No): {no_count}",
            f"- Not answered: {not_answered_count}",
        ]
        
        # Only include answered questions to reduce redundancy
        if strengths:
            prompt_parts.extend([
                "",
                "STRENGTHS (Areas where user is prepared):"
            ])
            for strength in strengths:
                prompt_parts.append(f"• {strength}")
        
        if text_responses:
            prompt_parts.extend([
                "",
                "TEXT RESPONSES (Detailed answers):"
            ])
            for text_response in text_responses:
                prompt_parts.append(f"• {text_response}")
        
        if areas_concern:
            prompt_parts.extend([
                "",
                "AREAS NEEDING ATTENTION (Immediate focus areas):"
            ])
            for concern in areas_concern:
                prompt_parts.append(f"• {concern}")
        
        if not_answered_count > 0:
            prompt_parts.extend([
                "",
                f"NOTE: {not_answered_count} question(s) were not answered. Focus recommendations on answered questions, but mention these gaps briefly."
            ])
        
        # Add context-aware contact information reference (don't repeat full list)
        prompt_parts.extend([
            "",
            "VERIFIED EMERGENCY CONTACTS (Use ONLY these numbers):",
            "911 (Emergency), (361) 886-2600 (Police Non-Emergency), (361) 826-3900 (Fire/OEM), (361) 826-2489 (City Services),",
            "1-800-RED-CROSS (Red Cross), (361) 884-9497 (Salvation Army), 1-800-621-3362 (FEMA), 211 (Texas Services),",
            "1-800-985-5990 (Disaster Distress Helpline), (361) 887-6291 (Food Bank), (361) 289-0959 (Weather Service).",
            "",
            "REQUIRED OUTPUT FORMAT (be concise, avoid repetition):",
            "",
            f"1. PREPAREDNESS SCORE: {normalized_score}/10",
            "   - Start with: 'Your overall preparedness score is {normalized_score}/10'",
            "   - Brief explanation of what the score means",
            "",
            "2. QUICK ASSESSMENT (2-3 sentences):",
            "   - Overall preparedness level based on answers and score",
            "   - Main strengths identified",
            "",
            f"3. PRIORITY RECOMMENDATIONS (only for 'No' answers and unanswered questions):",
            "   - Focus on 3-5 most critical action items",
            "   - Be specific and actionable",
            f"   - Prioritize based on zipcode {zipcode} risks (coastal/hurricane/flood)",
            "",
            f"4. AREA-SPECIFIC RISKS for zipcode {zipcode}:",
            "   - Brief note on hurricane season, flood zones, storm surge if applicable",
            "",
            "5. ESSENTIAL CONTACTS (only list relevant ones, don't repeat all):",
            "   - Include contacts relevant to their specific needs based on answers",
            "   - Use ONLY the verified numbers provided above",
            "",
            "CRITICAL INSTRUCTIONS:",
            "- Do NOT repeat information multiple times",
            "- Focus recommendations on specific 'No' answers and gaps",
            "- If most/all questions are unanswered, provide a brief general preparedness guide",
            "- Keep each section concise (2-4 items max)",
            "- All phone numbers must be 100% accurate",
            "- Be practical and actionable, not generic",
            ""
        ])
        
        return "\n".join(prompt_parts)
    
    @staticmethod
    def generate_summary_stats(evaluation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate summary statistics from evaluation data.
        
        Args:
            evaluation_data: Dictionary containing answers
        
        Returns:
            Dictionary with statistics
        """
        answers = evaluation_data.get('answers', {})
        questions = evaluation_data.get('questions', [])
        
        total_questions = len(questions)
        yes_count = sum(1 for ans in answers.values() if isinstance(ans, str) and ans == 'yes')
        no_count = sum(1 for ans in answers.values() if isinstance(ans, str) and ans == 'no')
        text_entries_count = sum(1 for ans in answers.values() if isinstance(ans, str) and ans not in ['yes', 'no', 'not answered'])
        answered_count = len(answers)
        
        # Calculate preparedness score (1-10)
        max_score = total_questions
        if answered_count > 0:
            score = (yes_count * 1.0) + (text_entries_count * 0.5)
            # Normalize to 1-10 scale: (score / max_score) * 9 + 1 to ensure range is 1-10
            normalized_score = max(1, min(10, round((score / max_score) * 9 + 1)))
        else:
            normalized_score = 1
        
        return {
            'total_questions': total_questions,
            'answered': answered_count,
            'yes_count': yes_count,
            'no_count': no_count,
            'text_entries_count': text_entries_count,
            'preparedness_score': normalized_score,
            'completion_rate': (answered_count / total_questions * 100) if total_questions > 0 else 0
        }

