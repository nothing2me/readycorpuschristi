"""
PDF Generator Service
Creates downloadable PDFs from safety evaluation responses
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus.flowables import KeepTogether
from datetime import datetime
from io import BytesIO
from typing import Dict, Any, Optional
import re
import html


class PDFGenerator:
    """Service for generating PDF documents from safety evaluation data"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Set up custom paragraph styles for PDF"""
        # Title style - left-aligned, larger
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            textColor='#000000',
            spaceAfter=12,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold',
            leading=22
        ))
        
        # Section header style (Strengths, Weaknesses, etc.)
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor='#000000',
            spaceAfter=4,
            spaceBefore=12,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold',
            leading=18
        ))
        
        # Body text style - left-aligned
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['BodyText'],
            fontSize=11,
            textColor='#000000',
            spaceAfter=4,
            alignment=TA_LEFT,
            leading=14,
            leftIndent=0,
            rightIndent=0
        ))
        
        # Bullet point style with proper indentation
        self.styles.add(ParagraphStyle(
            name='BulletPoint',
            parent=self.styles['BodyText'],
            fontSize=11,
            textColor='#000000',
            spaceAfter=3,
            alignment=TA_LEFT,
            leading=14,
            leftIndent=24,
            firstLineIndent=-12
        ))
        
        # Metadata style
        self.styles.add(ParagraphStyle(
            name='CustomMetadata',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor='#000000',
            alignment=TA_LEFT,
            spaceAfter=16
        ))
    
    def generate_safety_evaluation_pdf(self, 
                                      evaluation_response: str,
                                      zipcode: str,
                                      stats: Optional[Dict[str, Any]] = None,
                                      evaluation_data: Optional[Dict[str, Any]] = None) -> BytesIO:
        """
        Generate a PDF document from safety evaluation response.
        
        Args:
            evaluation_response: The AI-generated safety evaluation text
            zipcode: User's zipcode
            stats: Optional statistics from the evaluation
            evaluation_data: Optional raw evaluation data
        
        Returns:
            BytesIO object containing the PDF data
        """
        buffer = BytesIO()
        
        # Create the PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # Container for the 'Flowable' objects
        story = []
        
        # Add title - left-aligned
        title_text = f"Comprehensive Safety Assessment for Zipcode {zipcode} in Corpus Christi"
        title = Paragraph(title_text, self.styles['CustomTitle'])
        story.append(title)
        story.append(Spacer(1, 0.15*inch))
        
        # Add preparedness score at the top if available
        if stats and 'preparedness_score' in stats:
            score = stats.get('preparedness_score', 1)
            score_text = f"Overall Preparedness Score: {score}/10"
            score_para = Paragraph(f"<b>{score_text}</b>", self.styles['SectionHeader'])
            story.append(score_para)
            
            # Add score interpretation
            if score >= 8:
                interpretation = "Excellent preparedness level"
            elif score >= 6:
                interpretation = "Good preparedness level with some areas for improvement"
            elif score >= 4:
                interpretation = "Moderate preparedness level - several areas need attention"
            else:
                interpretation = "Low preparedness level - significant improvements needed"
            
            interp_para = Paragraph(f"<i>{interpretation}</i>", self.styles['CustomBody'])
            story.append(interp_para)
            story.append(Spacer(1, 0.15*inch))
        
        # Add evaluation response
        self._add_evaluation_content(story, evaluation_response)
        
        # Add questionnaire summary if available (group by answer type to reduce redundancy)
        if evaluation_data and 'answers' in evaluation_data:
            story.append(PageBreak())
            story.append(Paragraph("Questionnaire Summary", self.styles['SectionHeader']))
            story.append(Spacer(1, 0.2*inch))
            
            questions = evaluation_data.get('questions', [])
            answers = evaluation_data.get('answers', {})
            
            # Group questions by answer type for cleaner presentation
            yes_answers = []
            no_answers = []
            text_answers = []
            not_answered = []
            
            for idx, question in enumerate(questions, start=1):
                answer = answers.get(idx, 'not answered')
                if answer == 'yes':
                    yes_answers.append((idx, question))
                elif answer == 'no':
                    no_answers.append((idx, question))
                elif isinstance(answer, str) and answer not in ['yes', 'no', 'not answered']:
                    text_answers.append((idx, question, answer))
                else:
                    not_answered.append((idx, question))
            
            # Only show answered questions in detail, group unanswered briefly
            if yes_answers:
                story.append(Paragraph("<b>Strengths (Prepared Areas):</b>", self.styles['SectionHeader']))
                story.append(Spacer(1, 0.1*inch))
                for idx, question in yes_answers:
                    q_text = f"{idx}. {html.escape(question)} ✓"
                    q_para = Paragraph(q_text, self.styles['CustomBody'])
                    story.append(q_para)
                    story.append(Spacer(1, 0.05*inch))
                story.append(Spacer(1, 0.15*inch))
            
            if text_answers:
                story.append(Paragraph("<b>Text Responses:</b>", self.styles['SectionHeader']))
                story.append(Spacer(1, 0.1*inch))
                for idx, question, answer_text in text_answers:
                    q_text = f"<b>{idx}. {html.escape(question)}</b><br/>{html.escape(answer_text)}"
                    q_para = Paragraph(q_text, self.styles['CustomBody'])
                    story.append(q_para)
                    story.append(Spacer(1, 0.1*inch))
                story.append(Spacer(1, 0.15*inch))
            
            if no_answers:
                story.append(Paragraph("<b>Areas Needing Attention:</b>", self.styles['SectionHeader']))
                story.append(Spacer(1, 0.1*inch))
                for idx, question in no_answers:
                    q_text = f"{idx}. {html.escape(question)} ✗"
                    q_para = Paragraph(q_text, self.styles['CustomBody'])
                    story.append(q_para)
                    story.append(Spacer(1, 0.05*inch))
                story.append(Spacer(1, 0.15*inch))
            
            # Only mention unanswered if there are many
            if len(not_answered) > 3:
                story.append(Paragraph(f"<b>Note:</b> {len(not_answered)} questions were not answered. Please complete the full questionnaire for a more comprehensive assessment.", self.styles['CustomBody']))
                story.append(Spacer(1, 0.1*inch))
        
        # Build PDF
        doc.build(story)
        
        # Get the value of the BytesIO buffer
        buffer.seek(0)
        return buffer
    
    def _add_evaluation_content(self, story, evaluation_response: str):
        """Add evaluation content with proper formatting"""
        # Split by double newlines first to get paragraphs
        paragraphs = evaluation_response.split('\n\n')
        
        in_list = False
        
        for para_block in paragraphs:
            para_block = para_block.strip()
            if not para_block:
                # Reduced spacing for empty paragraphs
                story.append(Spacer(1, 0.05*inch))
                continue
            
            # Split paragraph into lines
            lines = para_block.split('\n')
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Check if this is a section header
                is_section_header = self._is_section_header(line)
                
                if is_section_header:
                    in_list = False
                    # Section header
                    header_text = line.rstrip(':').strip()
                    header_para = Paragraph(f"<b>{html.escape(header_text)}</b>", self.styles['SectionHeader'])
                    story.append(header_para)
                    # Minimal spacing after header
                    story.append(Spacer(1, 0.02*inch))
                elif self._is_bullet_point(line):
                    in_list = True
                    # Bullet point
                    bullet_text = self._extract_bullet_text(line)
                    formatted_text = self._format_text_for_pdf(bullet_text)
                    bullet_para = Paragraph(f"• {formatted_text}", self.styles['BulletPoint'])
                    story.append(bullet_para)
                    # Minimal spacing between bullet points
                    story.append(Spacer(1, 0.02*inch))
                else:
                    in_list = False
                    # Regular paragraph
                    formatted_text = self._format_text_for_pdf(line)
                    para = Paragraph(formatted_text, self.styles['CustomBody'])
                    story.append(para)
                    # Reduced spacing between paragraphs
                    story.append(Spacer(1, 0.05*inch))
    
    def _is_section_header(self, line: str) -> bool:
        """Check if a line is a section header"""
        line_lower = line.lower().strip()
        # Common section headers
        section_keywords = ['strengths', 'weaknesses', 'recommendations', 'conclusion', 
                           'summary', 'assessment', 'evaluation', 'overview', 'introduction',
                           'actions', 'areas', 'improvements', 'next steps']
        
        # Header if it ends with : and contains a keyword, or is short and uppercase
        if line.endswith(':') and len(line) < 100:
            for keyword in section_keywords:
                if keyword in line_lower:
                    return True
        
        # Also check for all caps short headers
        if line.isupper() and len(line) < 100 and len(line.split()) < 8:
            return True
        
        return False
    
    def _is_bullet_point(self, line: str) -> bool:
        """Check if a line is a bullet point"""
        # Match: - item, • item, * item, or 1. item
        return bool(re.match(r'^[-•*]\s+.+$', line)) or bool(re.match(r'^\d+[.)]\s+.+$', line))
    
    def _extract_bullet_text(self, line: str) -> str:
        """Extract text from bullet point line"""
        # Remove bullet marker
        line = re.sub(r'^[-•*]\s+', '', line)
        line = re.sub(r'^\d+[.)]\s+', '', line)
        return line.strip()
    
    def _format_text_for_pdf(self, text: str) -> str:
        """
        Format text for PDF output (escape HTML, handle formatting).
        
        Args:
            text: Raw text string
        
        Returns:
            Formatted HTML string safe for ReportLab
        """
        # Escape HTML characters first
        text = html.escape(text)
        
        # Convert **bold** to <b>bold</b>
        text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
        
        # Convert *italic* to <i>italic</i>
        text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)
        
        # Convert line breaks within paragraph to spaces (ReportLab will handle wrapping)
        text = text.replace('\n', ' ')
        
        return text
