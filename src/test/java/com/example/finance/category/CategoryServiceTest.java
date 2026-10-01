package com.example.finance.category;

import com.example.finance.common.ResourceNotFoundException;
import com.example.finance.user.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {
    @Mock CategoryRepository categories;
    @Mock UserRepository users;
    CategoryService service;
    final User owner = new User("owner@example.com", "hash", "Owner");
    @BeforeEach void setup() { service = new CategoryService(categories, users); }
    @Test void createsCustomCategory() {
        when(users.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(categories.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
        var result = service.create(owner.getId(), new CategoryRequest(" Pets ", CategoryType.EXPENSE));
        assertThat(result.name()).isEqualTo("Pets");
        assertThat(result.defaultCategory()).isFalse();
        assertThat(result.active()).isTrue();
    }
    @Test void deniesForeignCategoryBeforeWriting() {
        UUID foreign = UUID.randomUUID();
        when(categories.findByIdAndUserId(foreign, owner.getId())).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.archive(owner.getId(), foreign)).isInstanceOf(ResourceNotFoundException.class);
        verify(categories, never()).saveAndFlush(any());
    }
    @Test void ownedDefaultsCanBeRenamedAndArchived() {
        var category = new Category(owner, "Salary", CategoryType.INCOME, true);
        when(categories.findByIdAndUserId(category.getId(), owner.getId())).thenReturn(Optional.of(category));
        when(categories.saveAndFlush(category)).thenReturn(category);
        var patch = new CategoryPatch(); patch.setName("Pay");
        var result = service.update(owner.getId(), category.getId(), patch);
        assertThat(result.name()).isEqualTo("Pay");
        assertThat(result.defaultCategory()).isTrue();
        service.archive(owner.getId(), category.getId());
        assertThat(category.isActive()).isFalse();
        verify(categories, never()).delete(any());
    }
    @Test void defaultSeedContainsIncomeExpenseAndRelocationCategories() {
        var defaults = new DefaultCategoryService(categories);
        defaults.createFor(owner);
        @SuppressWarnings("unchecked") ArgumentCaptor<List<Category>> captor = ArgumentCaptor.forClass(List.class);
        verify(categories).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(16).allMatch(Category::isDefaultCategory);
        assertThat(captor.getValue()).anyMatch(c -> c.getName().equals("Moving / Relocation") && c.getType() == CategoryType.EXPENSE);
    }
}
