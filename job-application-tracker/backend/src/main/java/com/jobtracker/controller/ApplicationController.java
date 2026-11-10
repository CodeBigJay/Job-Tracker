package com.jobtracker.controller;

import com.jobtracker.model.*;
import com.jobtracker.model.Enums.InterviewType;
import com.jobtracker.model.Enums.Status;
import com.jobtracker.repository.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {
    record AppRequest(
            @NotBlank String company,
            @NotBlank String jobTitle,
            String location,
            String jobUrl,
            String salary,
            String source,
            Status status,
            LocalDate appliedDate,
            LocalDate closingDate,
            String description
    ) {}

    record InterviewRequest(
            @NotNull LocalDateTime scheduledAt,
            InterviewType type,
            String interviewer,
            String meetingUrl,
            String notes
    ) {}

    record InterviewUpdate(Boolean completed) {}
    record NoteRequest(@NotBlank String content) {}
    record ReminderRequest(@NotBlank String title, @NotNull LocalDateTime remindAt) {}
    record ReminderUpdate(Boolean completed) {}

    private final JobApplicationRepository applications;
    private final UserRepository users;
    private final InterviewRepository interviews;
    private final NoteRepository notes;
    private final ReminderRepository reminders;

    public ApplicationController(
            JobApplicationRepository applications,
            UserRepository users,
            InterviewRepository interviews,
            NoteRepository notes,
            ReminderRepository reminders
    ) {
        this.applications = applications;
        this.users = users;
        this.interviews = interviews;
        this.notes = notes;
        this.reminders = reminders;
    }

    private User user(String email) {
        return users.findByEmail(email).orElseThrow();
    }

    private JobApplication getApplication(UUID id, String email) {
        return applications.findByIdAndUserId(id, user(email).getId()).orElseThrow();
    }

    @GetMapping
    List<JobApplication> all(@RequestParam(required = false) Status status, Principal principal) {
        UUID userId = user(principal.getName()).getId();
        return status == null
                ? applications.findByUserIdOrderByUpdatedAtDesc(userId)
                : applications.findByUserIdAndStatusOrderByUpdatedAtDesc(userId, status);
    }

    @GetMapping("/{id}")
    JobApplication one(@PathVariable UUID id, Principal principal) {
        return getApplication(id, principal.getName());
    }

    @PostMapping
    JobApplication create(@Valid @RequestBody AppRequest request, Principal principal) {
        JobApplication application = JobApplication.builder()
                .user(user(principal.getName()))
                .company(request.company().trim())
                .jobTitle(request.jobTitle().trim())
                .location(request.location())
                .jobUrl(request.jobUrl())
                .salary(request.salary())
                .source(request.source())
                .status(request.status())
                .appliedDate(request.appliedDate())
                .closingDate(request.closingDate())
                .description(request.description())
                .build();
        return applications.save(application);
    }

    @PutMapping("/{id}")
    JobApplication update(
            @PathVariable UUID id,
            @Valid @RequestBody AppRequest request,
            Principal principal
    ) {
        JobApplication application = getApplication(id, principal.getName());
        application.setCompany(request.company().trim());
        application.setJobTitle(request.jobTitle().trim());
        application.setLocation(request.location());
        application.setJobUrl(request.jobUrl());
        application.setSalary(request.salary());
        application.setSource(request.source());
        application.setStatus(request.status());
        application.setAppliedDate(request.appliedDate());
        application.setClosingDate(request.closingDate());
        application.setDescription(request.description());
        return applications.save(application);
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable UUID id, Principal principal) {
        applications.delete(getApplication(id, principal.getName()));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dashboard/counts")
    Map<String, Long> counts(Principal principal) {
        UUID userId = user(principal.getName()).getId();
        Map<String, Long> result = new LinkedHashMap<>();
        for (Status status : Status.values()) {
            result.put(status.name(), applications.countByUserIdAndStatus(userId, status));
        }
        return result;
    }

    @PostMapping("/{id}/interviews")
    Interview addInterview(
            @PathVariable UUID id,
            @Valid @RequestBody InterviewRequest request,
            Principal principal
    ) {
        return interviews.save(Interview.builder()
                .application(getApplication(id, principal.getName()))
                .scheduledAt(request.scheduledAt())
                .type(request.type())
                .interviewer(request.interviewer())
                .meetingUrl(request.meetingUrl())
                .notes(request.notes())
                .completed(false)
                .build());
    }

    @GetMapping("/{id}/interviews")
    List<Interview> listInterviews(@PathVariable UUID id, Principal principal) {
        UUID applicationId = getApplication(id, principal.getName()).getId();
        return interviews.findByApplicationIdOrderByScheduledAtAsc(applicationId);
    }

    @PatchMapping("/{id}/interviews/{interviewId}")
    Interview updateInterview(
            @PathVariable UUID id,
            @PathVariable UUID interviewId,
            @RequestBody InterviewUpdate request,
            Principal principal
    ) {
        UUID applicationId = getApplication(id, principal.getName()).getId();
        Interview interview = interviews.findByIdAndApplicationId(interviewId, applicationId)
                .orElseThrow();
        if (request.completed() != null) interview.setCompleted(request.completed());
        return interviews.save(interview);
    }

    @DeleteMapping("/{id}/interviews/{interviewId}")
    ResponseEntity<Void> deleteInterview(
            @PathVariable UUID id,
            @PathVariable UUID interviewId,
            Principal principal
    ) {
        UUID applicationId = getApplication(id, principal.getName()).getId();
        Interview interview = interviews.findByIdAndApplicationId(interviewId, applicationId)
                .orElseThrow();
        interviews.delete(interview);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/notes")
    Note addNote(
            @PathVariable UUID id,
            @Valid @RequestBody NoteRequest request,
            Principal principal
    ) {
        return notes.save(Note.builder()
                .application(getApplication(id, principal.getName()))
                .content(request.content().trim())
                .build());
    }

    @GetMapping("/{id}/notes")
    List<Note> listNotes(@PathVariable UUID id, Principal principal) {
        UUID applicationId = getApplication(id, principal.getName()).getId();
        return notes.findByApplicationIdOrderByCreatedAtDesc(applicationId);
    }

    @DeleteMapping("/{id}/notes/{noteId}")
    ResponseEntity<Void> deleteNote(
            @PathVariable UUID id,
            @PathVariable UUID noteId,
            Principal principal
    ) {
        UUID applicationId = getApplication(id, principal.getName()).getId();
        Note note = notes.findByIdAndApplicationId(noteId, applicationId).orElseThrow();
        notes.delete(note);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reminders")
    Reminder addReminder(
            @PathVariable UUID id,
            @Valid @RequestBody ReminderRequest request,
            Principal principal
    ) {
        return reminders.save(Reminder.builder()
                .application(getApplication(id, principal.getName()))
                .title(request.title().trim())
                .remindAt(request.remindAt())
                .completed(false)
                .build());
    }

    @GetMapping("/{id}/reminders")
    List<Reminder> listApplicationReminders(@PathVariable UUID id, Principal principal) {
        UUID applicationId = getApplication(id, principal.getName()).getId();
        return reminders.findByApplicationIdOrderByRemindAtAsc(applicationId);
    }

    @PatchMapping("/{id}/reminders/{reminderId}")
    Reminder updateReminder(
            @PathVariable UUID id,
            @PathVariable UUID reminderId,
            @RequestBody ReminderUpdate request,
            Principal principal
    ) {
        UUID applicationId = getApplication(id, principal.getName()).getId();
        Reminder reminder = reminders.findByIdAndApplicationId(reminderId, applicationId)
                .orElseThrow();
        if (request.completed() != null) reminder.setCompleted(request.completed());
        return reminders.save(reminder);
    }

    @DeleteMapping("/{id}/reminders/{reminderId}")
    ResponseEntity<Void> deleteReminder(
            @PathVariable UUID id,
            @PathVariable UUID reminderId,
            Principal principal
    ) {
        UUID applicationId = getApplication(id, principal.getName()).getId();
        Reminder reminder = reminders.findByIdAndApplicationId(reminderId, applicationId)
                .orElseThrow();
        reminders.delete(reminder);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/reminders")
    List<Reminder> allReminders(Principal principal) {
        return reminders.findByApplicationUserIdOrderByRemindAtAsc(user(principal.getName()).getId());
    }
}
