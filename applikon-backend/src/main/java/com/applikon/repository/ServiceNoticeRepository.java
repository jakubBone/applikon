package com.applikon.repository;

import com.applikon.entity.ServiceNotice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ServiceNoticeRepository extends JpaRepository<ServiceNotice, Long> {

    @Query("SELECT n FROM ServiceNotice n WHERE n.active = true " +
           "AND (n.expiresAt IS NULL OR n.expiresAt > :now)")
    List<ServiceNotice> findActive(@Param("now") LocalDateTime now);
}
