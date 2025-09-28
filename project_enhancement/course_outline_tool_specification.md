# Course Outline Tool - Technical Specification
**Date:** September 27, 2025  
**Time:** 20:30 MST  
**Status:** 📋 TECHNICAL SPECIFICATION

## 🎯 Feature Overview

**Objective:** Implement a new AI tool that can retrieve and display complete course outlines, including all lessons and course metadata, when users ask for course syllabi or lesson lists.

## 🔧 Technical Implementation

### **Part 1: Core Function Implementation**

#### **File:** `backend/search_tools.py`
#### **Function:** `get_course_outline(course_title: str) -> dict | None`

```python
def get_course_outline(course_title: str) -> dict | None:
    """
    Retrieves the complete outline for a given course title from the vector store's metadata collection.

    Args:
        course_title: The exact title of the course to look up.

    Returns:
        A dictionary containing the course outline if found, otherwise None.
        
    Example:
        >>> get_course_outline("Introduction to Quantum Computing")
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
                }
            ]
        }
    """
    try:
        # Access the course_catalog collection
        results = vector_store.course_catalog.get(ids=[course_title])
        
        if not results or not results['metadatas'] or not results['metadatas'][0]:
            return None
            
        metadata = results['metadatas'][0]
        
        # Extract course information
        course_data = {
            "course_title": course_title,
            "course_link": metadata.get('course_link'),
            "lessons": []
        }
        
        # Parse lessons from stored JSON
        if 'lessons_json' in metadata:
            import json
            lessons_data = json.loads(metadata['lessons_json'])
            course_data["lessons"] = [
                {
                    "lesson_number": str(lesson.get('lesson_number', '')),
                    "lesson_title": lesson.get('lesson_title', '')
                }
                for lesson in lessons_data
            ]
        
        return course_data
        
    except Exception as e:
        print(f"Error retrieving course outline: {e}")
        return None
```

### **Part 2: Tool Definition and Registration**

#### **Tool Definition**
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

#### **Tool Class Implementation**
```python
class CourseOutlineTool(Tool):
    """Tool for retrieving complete course outlines"""
    
    def __init__(self, vector_store: VectorStore):
        self.store = vector_store
    
    def get_tool_definition(self) -> Dict[str, Any]:
        """Return Anthropic tool definition for this tool"""
        return course_outline_tool
    
    def execute(self, course_title: str) -> str:
        """
        Execute the course outline tool with given parameters.
        
        Args:
            course_title: The exact title of the course to look up
            
        Returns:
            Formatted course outline or error message
        """
        try:
            # Get course outline data
            course_data = get_course_outline(course_title)
            
            if not course_data:
                return f"Course '{course_title}' not found. Please check the course title and try again."
            
            # Format the response
            response_parts = []
            
            # Add course title
            response_parts.append(f"# {course_data['course_title']}")
            
            # Add course link if available
            if course_data.get('course_link'):
                response_parts.append(f"**Course Link:** {course_data['course_link']}")
            
            # Add lessons list
            if course_data.get('lessons'):
                response_parts.append("\n## Course Outline:")
                for lesson in course_data['lessons']:
                    response_parts.append(f"- **{lesson['lesson_number']}** {lesson['lesson_title']}")
            else:
                response_parts.append("\nNo lessons found for this course.")
            
            return "\n".join(response_parts)
            
        except Exception as e:
            return f"Error retrieving course outline: {str(e)}"
```

#### **Tool Registration in RAG System**
```python
# In backend/rag_system.py, add to __init__ method:
def __init__(self, config):
    # ... existing code ...
    
    # Initialize search tools
    self.tool_manager = ToolManager()
    self.search_tool = CourseSearchTool(self.vector_store)
    self.outline_tool = CourseOutlineTool(self.vector_store)  # Add this line
    
    # Register tools
    self.tool_manager.register_tool(self.search_tool)
    self.tool_manager.register_tool(self.outline_tool)  # Add this line
```

### **Part 3: AI System Integration**

#### **File:** `backend/ai_generator.py`
#### **System Prompt Update**

Add the following instruction to the main system prompt:

```python
COURSE_OUTLINE_INSTRUCTION = """
When the user asks for a course outline, syllabus, or lesson list, you must use the get_course_outline tool. 
Provide the exact course title as the argument. Once you receive the data from the tool, format your response 
to the user as follows:

1. Start with the course_title as a heading
2. Provide the course_link if available
3. Present the lessons as a numbered or bulleted list, showing both the lesson_number and lesson_title for each entry
4. If the tool returns no information, inform the user that you could not find a course with that exact title

Example user queries that should trigger this tool:
- "What is the outline for [Course Title]?"
- "Show me the syllabus for [Course Title]"
- "List all lessons in [Course Title]"
- "What lessons are covered in [Course Title]?"
"""
```

#### **Updated System Prompt**
```python
def generate_response(self, query: str, conversation_history: Optional[List] = None, 
                     tools: Optional[List] = None, tool_manager: Optional[ToolManager] = None) -> str:
    """
    Generate AI response with tool support
    """
    
    # Base system prompt
    system_prompt = f"""You are a helpful assistant for course materials. 
    {COURSE_OUTLINE_INSTRUCTION}
    
    You have access to the following tools:
    - search_course_content: Search for specific content within courses
    - get_course_outline: Get complete course outlines and lesson lists
    
    Use these tools when appropriate to provide accurate and helpful responses.
    """
    
    # ... rest of the implementation
```

## 🧪 Testing Specifications

### **Unit Tests**

#### **Test 1: Valid Course Title**
```python
def test_get_course_outline_valid_course():
    """Test get_course_outline with a valid course title"""
    result = get_course_outline("Introduction to Quantum Computing")
    
    assert result is not None
    assert "course_title" in result
    assert "course_link" in result
    assert "lessons" in result
    assert isinstance(result["lessons"], list)
    assert len(result["lessons"]) > 0
```

#### **Test 2: Invalid Course Title**
```python
def test_get_course_outline_invalid_course():
    """Test get_course_outline with an invalid course title"""
    result = get_course_outline("Non-existent Course")
    
    assert result is None
```

#### **Test 3: Tool Execution**
```python
def test_course_outline_tool_execution():
    """Test CourseOutlineTool.execute method"""
    tool = CourseOutlineTool(mock_vector_store)
    result = tool.execute("Introduction to Quantum Computing")
    
    assert isinstance(result, str)
    assert "Introduction to Quantum Computing" in result
    assert "Course Outline:" in result
```

### **Integration Tests**

#### **Test 1: End-to-End Query Processing**
```python
def test_course_outline_end_to_end():
    """Test complete flow from user query to formatted response"""
    # Simulate user query
    query = "What is the outline for Introduction to Quantum Computing?"
    
    # Process through AI system
    response = rag_system.query(query)
    
    # Verify response contains expected elements
    assert "Introduction to Quantum Computing" in response
    assert "Course Outline:" in response
    assert "lesson" in response.lower()
```

#### **Test 2: Error Handling**
```python
def test_course_outline_error_handling():
    """Test error handling for non-existent courses"""
    query = "What is the outline for Non-existent Course?"
    
    response = rag_system.query(query)
    
    assert "not found" in response.lower() or "could not find" in response.lower()
```

## 📊 Expected User Experience

### **Query Examples**

#### **Input Query:**
```
"What is the outline for Introduction to Quantum Computing?"
```

#### **Expected Output:**
```
# Introduction to Quantum Computing

**Course Link:** https://example.com/courses/quantum-computing-101

## Course Outline:
- **1.1** What is a Qubit?
- **1.2** Superposition and Entanglement
- **2.1** Quantum Gates
- **2.2** Quantum Circuits
- **3.1** Quantum Algorithms
```

#### **Error Case:**
```
"What is the outline for Non-existent Course?"
```

#### **Expected Output:**
```
Course 'Non-existent Course' not found. Please check the course title and try again.
```

## 🔍 Data Flow Diagram

```
User Query
    ↓
AI System (ai_generator.py)
    ↓
Tool Manager (search_tools.py)
    ↓
Course Outline Tool
    ↓
get_course_outline Function
    ↓
Vector Store (course_catalog)
    ↓
Course Metadata + Lessons
    ↓
Formatted Response
    ↓
User Interface
```

## 📋 Implementation Checklist

### **Phase 1: Core Function**
- [ ] Implement `get_course_outline` function in `backend/search_tools.py`
- [ ] Add proper error handling and logging
- [ ] Test function with valid course titles
- [ ] Test function with invalid course titles
- [ ] Validate output format matches specification

### **Phase 2: Tool Registration**
- [ ] Create `CourseOutlineTool` class
- [ ] Define tool schema and parameters
- [ ] Register tool in `ToolManager`
- [ ] Test tool availability and execution
- [ ] Verify tool integration with existing system

### **Phase 3: AI Integration**
- [ ] Update system prompt in `backend/ai_generator.py`
- [ ] Add course outline instruction to AI prompt
- [ ] Test AI tool usage with sample queries
- [ ] Verify response formatting and accuracy
- [ ] Test error handling and edge cases

### **Phase 4: Testing and Validation**
- [ ] Write unit tests for core function
- [ ] Write integration tests for tool execution
- [ ] Test end-to-end user query processing
- [ ] Validate output format and content
- [ ] Performance testing and optimization

## 🚀 Deployment Strategy

### **Development Phase**
1. Implement core function in development environment
2. Test with sample course data
3. Validate output format and functionality

### **Testing Phase**
1. Deploy to staging environment
2. Run comprehensive test suite
3. User acceptance testing
4. Performance validation

### **Production Phase**
1. Deploy to production environment
2. Monitor system performance
3. Collect user feedback
4. Iterate and improve based on usage

---

**Specification Version:** 1.0  
**Created:** September 27, 2025, 20:30 MST  
**Status:** 📋 Ready for Implementation
