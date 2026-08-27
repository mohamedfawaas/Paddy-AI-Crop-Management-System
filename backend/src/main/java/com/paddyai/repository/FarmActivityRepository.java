package com.paddyai.repository;
import com.paddyai.model.Farm;
import com.paddyai.model.FarmActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface FarmActivityRepository extends JpaRepository<FarmActivity,Long> {
    List<FarmActivity> findByFarmOrderByActivityDateDesc(Farm farm);
    long countByFarm(Farm farm);
    long deleteByFarm(Farm farm);
}
