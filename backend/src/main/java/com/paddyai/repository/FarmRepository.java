package com.paddyai.repository;
import com.paddyai.model.Farm;
import com.paddyai.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface FarmRepository extends JpaRepository<Farm,Long> {
    List<Farm> findByUserOrderByCreatedAtDesc(User user);
    Optional<Farm> findByIdAndUser(Long id, User user);
    long countByUser(User user);
    long deleteByUser(User user);
}
