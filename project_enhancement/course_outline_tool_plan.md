# Course Outline Tool Implementation Plan
**Date:** September 27, 2025  
**Time:** 20:30 MST  
**Status:** 📋 PLANNING PHASE

## 🎯 Feature Overview

**Objective:** Enhance the system's capabilities by introducing a new "tool" that can fetch and display the complete outline for a specific course. This involves creating the tool's logic, registering it within the system, and updating the AI's core instructions to utilize it effectively for outline-related user queries.

## 📋 Implementation Plan

### **Phase 1: Course Outline Tool Function**
**File:** `backend/search_tools.py`  
**Priority:** High  
**Estimated Time:** 2-3 hours

#### **1.1 Create the Core Function**
```python
def get_course_outline(course_title: str) -> dict | None:
    """
    Retrieves the complete outline for a given course title from the vector store's metadata collection.

    Args:
        course_title: The exact title of the course to look up.

    Returns:
        A dictionary containing the course outline if found, otherwise None.
    """
    # Implementation steps:
    # 1. Access the course_catalog collection from vector store
    # 2. Query for exact course title match
    # 3. Extract course metadata and lessons
    # 4. Format into standardized structure
    # 5. Handle "Course Not Found" gracefully
```

#### **1.2 Expected Output Structure**
```json
{
  "course_title": "Introduction to Quantum Computing",
  "course_link": "https://example.com/courses/quantum-computing-101",
  "lessons": [
    {
      "lesson_number": "1.1",
      "lesson_title": "What is a Qubit?"
    },
    {
      "lesson_number": "1.2", 
      "lesson_title": "Superposition and Entanglement"
    },
    {
      "lesson_number": "2.1",
      "lesson_title": "Quantum Gates"
    }
  ]
}
```

#### **1.3 Implementation Steps**
1. **Access Vector Store:** Use existing `vector_store.course_catalog` collection
2. **Query Course Data:** Search by exact course title match
3. **Extract Metadata:** Parse course information and lessons from stored data
4. **Format Response:** Structure data according to specification
5. **Error Handling:** Return None for courses not found

### **Phase 2: Tool Definition and Registration**
**File:** `backend/search_tools.py`  
**Priority:** High  
**Estimated Time:** 1-2 hours

#### **2.1 Create Tool Definition**
```python
course_outline_tool = {
    "name": "get_course_outline",
    "description": "Use this tool when a user asks for the syllabus, outline, or a list of all lessons for a specific course. The input must be the full, exact title of the course.",
    "input_schema": {
        "type": "object",
        "properties": {
            "course_title": {
                "type": "string",
                "description": "The full and exact title of the course."
            }
        },
        "required": ["course_title"]
    }
}
```

#### **2.2 Tool Registration**
- **Location:** `backend/search_tools.py` in the `ToolManager` class
- **Action:** Add new tool to the tool registry
- **Integration:** Ensure tool is available to the AI system

#### **2.3 Tool Class Implementation**
```python
class CourseOutlineTool(Tool):
    """Tool for retrieving complete course outlines"""
    
    def __init__(self, vector_store: VectorStore):
        self.store = vector_store
    
    def get_tool_definition(self) -> Dict[str, Any]:
        return course_outline_tool
    
    def execute(self, course_title: str) -> str:
        # Call get_course_outline function
        # Format response for AI consumption
        # Handle errors gracefully
```

### **Phase 3: AI System Integration**
**File:** `backend/ai_generator.py`  
**Priority:** High  
**Estimated Time:** 1-2 hours

#### **3.1 Update System Prompt**
Add instruction to the main system prompt:

```
"When the user asks for a course outline, syllabus, or lesson list, you must use the get_course_outline tool. Provide the exact course title as the argument. Once you receive the data from the tool, format your response to the user as follows:

Start with the course_title as a heading.
Provide the course_link.
Present the lessons as a numbered or bulleted list, showing both the lesson_number and lesson_title for each entry.
If the tool returns no information, inform the user that you could not find a course with that exact title."
```

#### **3.2 Tool Registration in RAG System**
- **Location:** `backend/rag_system.py`
- **Action:** Register the new tool with the tool manager
- **Integration:** Ensure tool is available during AI generation

### **Phase 4: Testing and Validation**
**Priority:** Medium  
**Estimated Time:** 1-2 hours

#### **4.1 Unit Testing**
- Test `get_course_outline` function with valid course titles
- Test error handling for non-existent courses
- Validate output format matches specification

#### **4.2 Integration Testing**
- Test tool registration and availability
- Test AI system's ability to use the tool
- Test end-to-end user query processing

#### **4.3 User Acceptance Testing**
- Test queries like "What is the outline for [Course Title]?"
- Verify formatted output includes all required elements
- Test error handling for invalid course titles

## 🔧 Technical Implementation Details

### **Data Flow Architecture**
```
User Query → AI System → Tool Manager → Course Outline Tool → Vector Store → Course Data → Formatted Response
```

### **Key Components**

#### **1. Course Outline Function**
- **Input:** Exact course title string
- **Process:** Query vector store course_catalog collection
- **Output:** Structured course outline data
- **Error Handling:** Graceful handling of missing courses

#### **2. Tool Definition**
- **Name:** `get_course_outline`
- **Purpose:** Retrieve complete course outlines
- **Input:** Course title (required)
- **Output:** Structured course data

#### **3. AI Integration**
- **Trigger:** User asks for course outline/syllabus/lesson list
- **Action:** AI calls tool with exact course title
- **Response:** Formatted course outline with lessons

### **Data Structure Requirements**

#### **Input Validation**
- Course title must be exact match
- Handle case sensitivity appropriately
- Validate input format

#### **Output Formatting**
- Course title as heading
- Course link prominently displayed
- Lessons as numbered/bulleted list
- Clear error messages for missing courses

## 📊 Success Criteria

### **Functional Requirements**
- ✅ **Tool Function:** `get_course_outline` function exists and works correctly
- ✅ **Tool Registration:** Tool is properly registered in the system
- ✅ **AI Integration:** AI system can use the tool when appropriate
- ✅ **Data Formatting:** Output matches specified structure exactly
- ✅ **Error Handling:** Graceful handling of missing courses

### **User Experience Requirements**
- ✅ **Query Processing:** "What is the outline for [Course Title]?" works correctly
- ✅ **Formatted Output:** Clean, readable course outline presentation
- ✅ **Error Messages:** Clear feedback when courses are not found
- ✅ **Link Access:** Course links are clickable and functional

### **Technical Requirements**
- ✅ **Performance:** Tool execution is fast and efficient
- ✅ **Reliability:** Consistent results across different course titles
- ✅ **Integration:** Seamless integration with existing system
- ✅ **Maintainability:** Clean, well-documented code

## 🚀 Implementation Timeline

### **Week 1: Core Development**
- **Day 1-2:** Implement `get_course_outline` function
- **Day 3:** Create tool definition and registration
- **Day 4:** Update AI system prompt and integration
- **Day 5:** Initial testing and debugging

### **Week 2: Testing and Refinement**
- **Day 1-2:** Comprehensive testing
- **Day 3:** User acceptance testing
- **Day 4:** Performance optimization
- **Day 5:** Documentation and deployment

## 🔍 Risk Assessment

### **Technical Risks**
- **Data Format Mismatch:** Course data structure may not match expected format
- **Performance Impact:** Additional tool may slow down AI responses
- **Integration Issues:** Tool may not integrate properly with existing system

### **Mitigation Strategies**
- **Thorough Testing:** Comprehensive testing at each phase
- **Fallback Handling:** Graceful error handling for all edge cases
- **Performance Monitoring:** Monitor system performance after implementation
- **Incremental Deployment:** Deploy in stages to catch issues early

## 📝 Documentation Requirements

### **Code Documentation**
- Function docstrings with examples
- Tool definition documentation
- Integration guide for future developers

### **User Documentation**
- Feature description and usage examples
- Query format guidelines
- Troubleshooting guide

## 🎯 Acceptance Criteria

### **Primary Criteria**
1. **Function Exists:** `get_course_outline` function is implemented in `backend/search_tools.py`
2. **Tool Registered:** Tool is properly registered in the system
3. **AI Integration:** System prompt updated with tool usage instructions
4. **Query Success:** "What is the outline for [Course Title]?" returns formatted course outline
5. **Error Handling:** Missing courses return appropriate error messages

### **Secondary Criteria**
1. **Performance:** Tool execution completes within acceptable time limits
2. **Formatting:** Output matches specified structure exactly
3. **Integration:** Tool works seamlessly with existing system
4. **Documentation:** All code is properly documented
5. **Testing:** Comprehensive test coverage for all scenarios

## 📋 Implementation Checklist

### **Phase 1: Core Function**
- [ ] Implement `get_course_outline` function
- [ ] Add proper error handling
- [ ] Test with valid course titles
- [ ] Test with invalid course titles
- [ ] Validate output format

### **Phase 2: Tool Registration**
- [ ] Create tool definition
- [ ] Implement `CourseOutlineTool` class
- [ ] Register tool in `ToolManager`
- [ ] Test tool availability
- [ ] Verify tool execution

### **Phase 3: AI Integration**
- [ ] Update system prompt
- [ ] Test AI tool usage
- [ ] Verify response formatting
- [ ] Test error handling
- [ ] Validate end-to-end flow

### **Phase 4: Testing and Deployment**
- [ ] Unit testing
- [ ] Integration testing
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Documentation completion

---

**Plan Version:** 1.0  
**Created:** September 27, 2025, 20:30 MST  
**Status:** 📋 Ready for Implementation
