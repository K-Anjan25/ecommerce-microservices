package com.ecommerce.product_service.service;

import com.ecommerce.common.model.UserCredential;
import com.ecommerce.product_service.audit.AuditLogService;
import com.ecommerce.product_service.dto.question.AnswerQuestionRequest;
import com.ecommerce.product_service.dto.question.AskQuestionRequest;
import com.ecommerce.product_service.dto.question.QuestionDto;
import com.ecommerce.product_service.model.Product;
import com.ecommerce.product_service.model.Question;
import com.ecommerce.product_service.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final ProductService productService;
    private final AuditLogService auditLogService;

    /** Public: paged Q&A for a product, newest first. */
    public Page<QuestionDto> getQuestionsForProduct(UUID productId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50));
        return questionRepository
                .findByProductIdOrderByCreatedDateDesc(productId, pageable)
                .map(this::toDto);
    }

    /** Staff: every question across the catalog, newest first. */
    public Page<QuestionDto> getAllQuestions(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50));
        return questionRepository.findAllByOrderByCreatedDateDesc(pageable).map(this::toDto);
    }

    public long countUnanswered() {
        return questionRepository.countByAnswerIsNull();
    }

    /** Customer: ask about a product. Asker identity is server-derived. */
    @Transactional
    public QuestionDto askQuestion(AskQuestionRequest request) {
        Product product = productService.getProductById(request.getProductId());
        UserCredential credential = currentCredential();

        Question question = Question.builder()
                .product(product)
                .text(request.getText().trim())
                .askedBy(credential != null ? credential.getUsername() : "Customer")
                .userId(currentUserId())
                .build();
        return toDto(questionRepository.save(question));
    }

    /** Staff: answer publicly (re-answering replaces the previous answer). */
    @Transactional
    public QuestionDto answerQuestion(UUID id, AnswerQuestionRequest request) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Question with id " + id + " could not be found!"));
        UserCredential credential = currentCredential();
        question.setAnswer(request.getAnswer().trim());
        question.setAnsweredBy(credential != null ? credential.getUsername() : "Staff");
        question.setAnsweredAt(LocalDateTime.now());
        QuestionDto saved = toDto(questionRepository.save(question));
        auditLogService.record("QUESTION_ANSWERED", "PRODUCT",
                String.valueOf(saved.getProductId()), "Q: " + saved.getText());
        return saved;
    }

    /** Staff: remove a question (moderation). */
    @Transactional
    public void deleteQuestion(UUID id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Question with id " + id + " could not be found!"));
        auditLogService.record("QUESTION_DELETED", "PRODUCT",
                String.valueOf(question.getProduct().getId()), "Q: " + question.getText());
        questionRepository.delete(question);
    }

    private QuestionDto toDto(Question question) {
        return QuestionDto.builder()
                .id(question.getId())
                .text(question.getText())
                .askedBy(question.getAskedBy())
                .createdDate(question.getCreatedDate())
                .answer(question.getAnswer())
                .answeredBy(question.getAnsweredBy())
                .answeredAt(question.getAnsweredAt())
                .productId(question.getProduct() != null ? question.getProduct().getId() : null)
                .build();
    }

    private UserCredential currentCredential() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return null;
        Object credential = authentication.getCredentials();
        return credential instanceof UserCredential ? (UserCredential) credential : null;
    }

    private UUID currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return null;
        try {
            return UUID.fromString(String.valueOf(authentication.getPrincipal()));
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }
}
