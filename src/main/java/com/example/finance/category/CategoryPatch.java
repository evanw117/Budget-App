package com.example.finance.category;

import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import jakarta.validation.constraints.Size;

public class CategoryPatch {
    @Size(min = 1, max = 100) private String name;
    private CategoryType type;
    private Boolean active;
    public String getName() { return name; }
    public CategoryType getType() { return type; }
    public Boolean getActive() { return active; }
    @JsonSetter(nulls = Nulls.FAIL) public void setName(String value) { name = value.strip(); }
    @JsonSetter(nulls = Nulls.FAIL) public void setType(CategoryType value) { type = value; }
    @JsonSetter(nulls = Nulls.FAIL) public void setActive(Boolean value) { active = value; }
}
