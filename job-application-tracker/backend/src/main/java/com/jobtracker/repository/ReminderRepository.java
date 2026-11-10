package com.jobtracker.repository;

import com.jobtracker.model.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface ReminderRepository extends JpaRepository<Reminder, UUID> {
    List<Reminder> findByApplicationUserIdOrderByRemindAtAsc(UUID userId);
    List<Reminder> findByApplicationIdOrderByRemindAtAsc(UUID applicationId);
    Optional<Reminder> findByIdAndApplicationId(UUID id, UUID applicationId);
}
