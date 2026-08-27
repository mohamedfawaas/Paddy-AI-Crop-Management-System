package com.paddyai.repository;
import com.paddyai.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByResetToken(String resetToken);
    boolean existsByEmail(String email);
    List<User> findAllByOrderByCreatedAtDesc();
    long countByRole(User.Role role);
}
