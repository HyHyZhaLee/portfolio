package com.huygialy.portfolio.visit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Read side of {@code visit} for other features, which never touch its repository (backend guide principle 3). */
@Service
@Transactional(readOnly = true)
public class VisitQueryService {

    private final PageViewRepository repository;

    public VisitQueryService(PageViewRepository repository) {
        this.repository = repository;
    }

    /** All stored views, distinct visitors, and the first view's time (PF-005 P7, FR-9). */
    public PageViewTotals totals() {
        return repository.totals();
    }
}
