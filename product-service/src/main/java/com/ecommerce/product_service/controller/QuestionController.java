package com.ecommerce.product_service.controller;

import com.ecommerce.product_service.dto.question.AnswerQuestionRequest;
import com.ecommerce.product_service.dto.question.AskQuestionRequest;
import com.ecommerce.product_service.dto.question.QuestionDto;
import com.ecommerce.product_service.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/questions")
public class QuestionController {

    private final QuestionService questionService;

    /** Public — rendered on the product page. */
    @GetMapping
    public ResponseEntity<Page<QuestionDto>> getQuestions(
            @RequestParam("productId") UUID productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(questionService.getQuestionsForProduct(productId, page, size));
    }

    /** Signed-in customers only. */
    @PostMapping
    public ResponseEntity<QuestionDto> askQuestion(@Valid @RequestBody AskQuestionRequest request) {
        return new ResponseEntity<>(questionService.askQuestion(request), HttpStatus.CREATED);
    }

    /** Staff console listing. */
    @GetMapping("/all")
    public ResponseEntity<Page<QuestionDto>> getAllQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(questionService.getAllQuestions(page, size));
    }

    @GetMapping("/unanswered-count")
    public ResponseEntity<Map<String, Long>> unansweredCount() {
        return ResponseEntity.ok(Map.of("count", questionService.countUnanswered()));
    }

    /** Staff only (enforced at the gateway by role routing). */
    @PutMapping("/{id}/answer")
    public ResponseEntity<QuestionDto> answerQuestion(@PathVariable UUID id,
                                                      @Valid @RequestBody AnswerQuestionRequest request) {
        return ResponseEntity.ok(questionService.answerQuestion(id, request));
    }

    /** Staff only (enforced at the gateway by role routing). */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable UUID id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }
}
