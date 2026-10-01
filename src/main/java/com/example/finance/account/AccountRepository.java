package com.example.finance.account;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface AccountRepository extends JpaRepository<Account, UUID> {
    List<Account> findAllByUserIdOrderByCreatedAtAscIdAsc(UUID userId);
    Optional<Account> findByIdAndUserId(UUID id, UUID userId);
}
