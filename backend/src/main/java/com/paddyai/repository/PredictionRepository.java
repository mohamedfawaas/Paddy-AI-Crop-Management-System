package com.paddyai.repository;
import com.paddyai.model.Prediction;
import com.paddyai.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
public interface PredictionRepository extends JpaRepository<Prediction,Long> {
    List<Prediction> findByUserOrderByCreatedAtDesc(User user);
    List<Prediction> findByUserAndTypeOrderByCreatedAtDesc(User user,String type);
    List<Prediction> findAllByOrderByCreatedAtDesc();
    List<Prediction> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    long countByUser(User user);
    long deleteByUser(User user);
    long countByType(String type);
    long countByFeedback(String feedback);
    long countByFeedbackIsNotNull();
    @Query("SELECT COUNT(DISTINCT p.user) FROM Prediction p")
    long countDistinctUsers();
}
