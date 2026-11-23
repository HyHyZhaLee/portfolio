package com.huygialy.portfolio.visit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/** Page views are only inserted (FR-12); {@code save} runs in its own short write transaction. */
public interface PageViewRepository extends JpaRepository<PageViewEntity, Long> {

    /** One aggregate row; {@code min(viewedAt)} is {@code null} when the table is empty (PF-005 P7). */
    @Query("select new com.huygialy.portfolio.visit.PageViewTotals(count(p), count(distinct p.visitorHash),"
            + " min(p.viewedAt)) from PageViewEntity p")
    PageViewTotals totals();
}
