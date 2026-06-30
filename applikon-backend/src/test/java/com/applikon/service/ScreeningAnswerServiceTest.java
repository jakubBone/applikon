package com.applikon.service;

import com.applikon.dto.ScreeningAnswerRequest;
import com.applikon.dto.ScreeningAnswerResponse;
import com.applikon.entity.ScreeningAnswer;
import com.applikon.entity.User;
import com.applikon.repository.ScreeningAnswerRepository;
import com.applikon.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ScreeningAnswerService tests")
class ScreeningAnswerServiceTest {

    private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Mock
    private ScreeningAnswerRepository screeningAnswerRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ScreeningAnswerService service;

    @Captor
    private ArgumentCaptor<List<ScreeningAnswer>> savedCaptor;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User("test@example.com", "Test User", "google-test");
    }

    @Test
    void save_replacesExistingSet_andReindexesOrderFromZero() {
        when(userRepository.getReferenceById(USER_ID)).thenReturn(user);
        when(screeningAnswerRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        service.save(USER_ID, List.of(
                new ScreeningAnswerRequest("about-me", null, "I am a dev", false),
                new ScreeningAnswerRequest(null, "Pets?", "A cat", true)
        ));

        verify(screeningAnswerRepository).deleteByUserId(USER_ID);
        verify(screeningAnswerRepository).saveAll(savedCaptor.capture());

        List<ScreeningAnswer> saved = savedCaptor.getValue();
        assertEquals(2, saved.size());
        assertEquals("about-me", saved.get(0).getQuestionKey());
        assertEquals(0, saved.get(0).getSortOrder());
        assertEquals("Pets?", saved.get(1).getLabel());
        assertEquals(1, saved.get(1).getSortOrder());
        assertEquals(user, saved.get(0).getUser());
    }

    @Test
    void save_dropsCustomQuestionsWithBlankOrNullLabel() {
        when(userRepository.getReferenceById(USER_ID)).thenReturn(user);
        when(screeningAnswerRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        service.save(USER_ID, List.of(
                new ScreeningAnswerRequest("about-me", null, "Kept", false),
                new ScreeningAnswerRequest(null, "   ", "Dropped (blank label)", true),
                new ScreeningAnswerRequest(null, null, "Dropped (null label)", true)
        ));

        verify(screeningAnswerRepository).saveAll(savedCaptor.capture());
        List<ScreeningAnswer> saved = savedCaptor.getValue();
        assertEquals(1, saved.size());
        assertEquals("about-me", saved.get(0).getQuestionKey());
        assertEquals(0, saved.get(0).getSortOrder());
    }

    @Test
    void findByUser_mapsEntitiesPreservingRepositoryOrder() {
        when(screeningAnswerRepository.findByUserIdOrderBySortOrder(USER_ID))
                .thenReturn(List.of(answer("about-me", "First", 0), answer("salary", "Second", 1)));

        List<ScreeningAnswerResponse> result = service.findByUser(USER_ID);

        assertEquals(2, result.size());
        assertEquals("about-me", result.get(0).questionKey());
        assertEquals("First", result.get(0).answer());
        assertEquals(0, result.get(0).sortOrder());
        assertEquals("salary", result.get(1).questionKey());
    }

    private ScreeningAnswer answer(String questionKey, String text, int sortOrder) {
        ScreeningAnswer entity = new ScreeningAnswer();
        entity.setQuestionKey(questionKey);
        entity.setAnswer(text);
        entity.setSortOrder(sortOrder);
        return entity;
    }
}
