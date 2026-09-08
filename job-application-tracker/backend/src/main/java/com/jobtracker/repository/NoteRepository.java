package com.jobtracker.repository;
import com.jobtracker.model.Note; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface NoteRepository extends JpaRepository<Note,UUID>{List<Note> findByApplicationIdOrderByCreatedAtDesc(UUID id);}