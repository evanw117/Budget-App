package com.example.finance.transaction;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import java.math.BigDecimal;
import java.util.*;

public interface TransactionRepository extends JpaRepository<FinancialTransaction, UUID>, JpaSpecificationExecutor<FinancialTransaction> {
    @EntityGraph(attributePaths = {"account", "category"})
    Optional<FinancialTransaction> findByIdAndUserId(UUID id, UUID userId);
    @Override @EntityGraph(attributePaths = {"account", "category"})
    Page<FinancialTransaction> findAll(Specification<FinancialTransaction> spec, Pageable pageable);

    interface AccountTotal {
        UUID getAccountId();
        BigDecimal getNetAmount();
    }
    @Query(value = """
            SELECT account_id AS accountId,
                   SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END) AS netAmount
            FROM financial_transaction WHERE user_id = :owner GROUP BY account_id
            """, nativeQuery = true)
    List<AccountTotal> totalsByOwner(UUID owner);
    @Query(value = """
            SELECT COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END), 0)
            FROM financial_transaction WHERE user_id = :owner AND account_id = :account
            """, nativeQuery = true)
    BigDecimal netAmount(UUID owner, UUID account);
}
