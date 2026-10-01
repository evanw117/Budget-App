package com.example.finance.category;

import com.example.finance.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.util.*;

@Service
public class DefaultCategoryService {
    public static final List<String> INCOME = List.of("Salary", "Freelance", "Other Income");
    public static final List<String> EXPENSE = List.of("Housing", "Groceries", "Transport", "Dining", "Utilities",
            "Entertainment", "Shopping", "Healthcare", "Education", "Subscriptions", "Travel", "Moving / Relocation", "Other");
    private final CategoryRepository categories;
    public DefaultCategoryService(CategoryRepository categories) { this.categories = categories; }

    // Runs inside registration's transaction: either user and all defaults commit, or neither does.
    @Transactional(propagation = Propagation.MANDATORY)
    public void createFor(User user) {
        List<Category> defaults = new ArrayList<>();
        INCOME.forEach(name -> defaults.add(new Category(user, name, CategoryType.INCOME, true)));
        EXPENSE.forEach(name -> defaults.add(new Category(user, name, CategoryType.EXPENSE, true)));
        categories.saveAll(defaults);
    }
}
