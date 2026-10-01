package com.example.finance.category;

import com.example.finance.common.ResourceNotFoundException;
import com.example.finance.user.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class CategoryService {
    private final CategoryRepository categories;
    private final UserRepository users;
    public CategoryService(CategoryRepository categories, UserRepository users) { this.categories = categories; this.users = users; }
    public List<CategoryResponse> list(UUID owner) {
        return categories.findAllByUserIdOrderByTypeAscNameAscIdAsc(owner).stream().map(CategoryResponse::from).toList();
    }
    public CategoryResponse get(UUID owner, UUID id) { return CategoryResponse.from(owned(owner, id)); }
    @Transactional
    public CategoryResponse create(UUID owner, CategoryRequest request) {
        var user = users.findById(owner).orElseThrow(() -> new BadCredentialsException("Invalid authentication"));
        return CategoryResponse.from(categories.saveAndFlush(new Category(user, request.name(), request.type(), false)));
    }
    @Transactional
    public CategoryResponse update(UUID owner, UUID id, CategoryPatch request) {
        var category = owned(owner, id);
        category.update(request);
        return CategoryResponse.from(categories.saveAndFlush(category));
    }
    @Transactional public void archive(UUID owner, UUID id) { owned(owner, id).archive(); }
    private Category owned(UUID owner, UUID id) {
        return categories.findByIdAndUserId(id, owner).orElseThrow(ResourceNotFoundException::new);
    }
}
