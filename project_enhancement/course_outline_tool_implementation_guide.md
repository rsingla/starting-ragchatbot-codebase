# Course Outline Tool - Implementation Guide
**Date:** September 27, 2025  
**Time:** 20:30 MST  
**Status:** 📋 IMPLEMENTATION GUIDE

## 🎯 Implementation Overview

This guide provides step-by-step instructions for implementing the Course Outline Tool feature. Follow these steps in order to ensure proper integration with the existing system.

## 📋 Step-by-Step Implementation

### **Step 1: Implement Core Function**

#### **File:** `backend/search_tools.py`
#### **Location:** Add after existing functions, before the `ToolManager` class

```python
def get_course_outline(course_title: str) -> dict | None:
    """
    Retrieves the complete outline for a given course title from the vector store's metadata collection.

    Args:
        course_title: The exact title of the course to look up.

    Returns:
        A dictionary containing the course outline if found, otherwise None.
    """
    try:
        # Access the course_catalog collection from vector store
        # Note: This assumes you have access to the vector store instance
        # You may need to pass it as a parameter or access it differently
        
        # Query the collection for the exact course title
        results = vector_store.course_catalog.get(ids=[course_title])
        
        # Handle "Course Not Found" case
        if not results or not results['metadatas'] or not results['metadatas'][0]:
            return None
            
        metadata = results['metadatas'][0]
        
        # Structure the output according to specification
        course_data = {
            "course_title": course_title,
            "course_link": metadata.get('course_link'),
            "lessons": []
        }
        
        # Parse lessons from stored JSON
        if 'lessons_json' in metadata:
            import json
            try:
                lessons_data = json.loads(metadata['lessons_json'])
                course_data["lessons"] = [
                    {
                        "lesson_number": str(lesson.get('lesson_number', '')),
                        "lesson_title": lesson.get('lesson_title', '')
                    }
                    for lesson in lessons_data
                ]
            except json.JSONDecodeError:
                print(f"Error parsing lessons JSON for course: {course_title}")
                course_data["lessons"] = []
        
        return course_data
        
    except Exception as e:
        print(f"Error retrieving course outline for '{course_title}': {e}")
        return None
```

### **Step 2: Create Tool Class**

#### **File:** `backend/search_tools.py`
#### **Location:** Add after the `CourseSearchTool` class

```python
class CourseOutlineTool(Tool):
    """Tool for retrieving complete course outlines"""
    
    def __init__(self, vector_store: VectorStore):
        self.store = vector_store
    
    def get_tool_definition(self) -> Dict[str, Any]:
        """Return Anthropic tool definition for this tool"""
        return {
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
    
    def execute(self, course_title: str) -> str:
        """
        Execute the course outline tool with given parameters.
        
        Args:
            course_title: The exact title of the course to look up
            
        Returns:
            Formatted course outline or error message
        """
        try:
            # Get course outline data using the core function
            course_data = get_course_outline(course_title)
            
            if not course_data:
                return f"Course '{course_title}' not found. Please check the course title and try again."
            
            # Format the response for the AI system
            response_parts = []
            
            # Add course title as heading
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

### **Step 3: Register Tool in RAG System**

#### **File:** `backend/rag_system.py`
#### **Location:** In the `__init__` method, after existing tool registration

```python
def __init__(self, config):
    self.config = config
    
    # Initialize core components
    self.document_processor = DocumentProcessor(config.CHUNK_SIZE, config.CHUNK_OVERLAP)
    self.vector_store = VectorStore(config.CHROMA_PATH, config.EMBEDDING_MODEL, config.MAX_RESULTS)
    self.ai_generator = AIGenerator(config.ANTHROPIC_API_KEY, config.ANTHROPIC_MODEL)
    self.session_manager = SessionManager(config.MAX_HISTORY)
    
    # Initialize search tools
    self.tool_manager = ToolManager()
    self.search_tool = CourseSearchTool(self.vector_store)
    self.outline_tool = CourseOutlineTool(self.vector_store)  # Add this line
    
    # Register tools
    self.tool_manager.register_tool(self.search_tool)
    self.tool_manager.register_tool(self.outline_tool)  # Add this line
```

### **Step 4: Update AI System Prompt**

#### **File:** `backend/ai_generator.py`
#### **Location:** In the `generate_response` method, update the system prompt

```python
def generate_response(self, query: str, conversation_history: Optional[List] = None, 
                     tools: Optional[List] = None, tool_manager: Optional[ToolManager] = None) -> str:
    """
    Generate AI response with tool support
    """
    
    # Enhanced system prompt with course outline instructions
    system_prompt = """You are a helpful assistant for course materials. You can search course content and retrieve complete course outlines.

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

You have access to the following tools:
- search_course_content: Search for specific content within courses
- get_course_outline: Get complete course outlines and lesson lists

Use these tools when appropriate to provide accurate and helpful responses."""
    
    # ... rest of the existing implementation
```

### **Step 5: Fix Import Issues**

#### **File:** `backend/search_tools.py`
#### **Location:** At the top of the file, ensure proper imports

```python
from typing import Dict, Any, Optional, Protocol
from abc import ABC, abstractmethod
from vector_store import VectorStore, SearchResults
import json  # Add this import for JSON parsing
```

### **Step 6: Update Function Access**

#### **File:** `backend/search_tools.py`
#### **Location:** Modify the `get_course_outline` function to accept vector_store parameter

```python
def get_course_outline(course_title: str, vector_store: VectorStore) -> dict | None:
    """
    Retrieves the complete outline for a given course title from the vector store's metadata collection.

    Args:
        course_title: The exact title of the course to look up.
        vector_store: The vector store instance to query.

    Returns:
        A dictionary containing the course outline if found, otherwise None.
    """
    try:
        # Access the course_catalog collection from vector store
        results = vector_store.course_catalog.get(ids=[course_title])
        
        # Handle "Course Not Found" case
        if not results or not results['metadatas'] or not results['metadatas'][0]:
            return None
            
        metadata = results['metadatas'][0]
        
        # Structure the output according to specification
        course_data = {
            "course_title": course_title,
            "course_link": metadata.get('course_link'),
            "lessons": []
        }
        
        # Parse lessons from stored JSON
        if 'lessons_json' in metadata:
            try:
                lessons_data = json.loads(metadata['lessons_json'])
                course_data["lessons"] = [
                    {
                        "lesson_number": str(lesson.get('lesson_number', '')),
                        "lesson_title": lesson.get('lesson_title', '')
                    }
                    for lesson in lessons_data
                ]
            except json.JSONDecodeError:
                print(f"Error parsing lessons JSON for course: {course_title}")
                course_data["lessons"] = []
        
        return course_data
        
    except Exception as e:
        print(f"Error retrieving course outline for '{course_title}': {e}")
        return None
```

#### **Update the CourseOutlineTool.execute method:**

```python
def execute(self, course_title: str) -> str:
    """
    Execute the course outline tool with given parameters.
    
    Args:
        course_title: The exact title of the course to look up
        
    Returns:
        Formatted course outline or error message
    """
    try:
        # Get course outline data using the core function
        course_data = get_course_outline(course_title, self.store)
        
        if not course_data:
            return f"Course '{course_title}' not found. Please check the course title and try again."
        
        # Format the response for the AI system
        response_parts = []
        
        # Add course title as heading
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

## 🧪 Testing Instructions

### **Test 1: Basic Functionality**
```python
# Test the core function
def test_get_course_outline():
    # This should be run in a test environment with sample data
    result = get_course_outline("Introduction to Quantum Computing", vector_store)
    assert result is not None
    assert "course_title" in result
    assert "lessons" in result
```

### **Test 2: Tool Execution**
```python
# Test the tool class
def test_course_outline_tool():
    tool = CourseOutlineTool(vector_store)
    result = tool.execute("Introduction to Quantum Computing")
    assert isinstance(result, str)
    assert "Introduction to Quantum Computing" in result
```

### **Test 3: End-to-End Integration**
```python
# Test complete flow
def test_course_outline_integration():
    # This should be run with the full system
    query = "What is the outline for Introduction to Quantum Computing?"
    response = rag_system.query(query)
    assert "Introduction to Quantum Computing" in response
    assert "Course Outline:" in response
```

## 🔍 Validation Checklist

### **Implementation Validation**
- [ ] `get_course_outline` function exists in `backend/search_tools.py`
- [ ] `CourseOutlineTool` class is implemented
- [ ] Tool is registered in `backend/rag_system.py`
- [ ] AI system prompt is updated in `backend/ai_generator.py`
- [ ] All imports are properly added
- [ ] Function parameters are correctly passed

### **Functionality Validation**
- [ ] Tool can retrieve course data from vector store
- [ ] Tool handles missing courses gracefully
- [ ] Tool formats output correctly
- [ ] AI system can use the tool
- [ ] User queries trigger the tool appropriately

### **Error Handling Validation**
- [ ] Non-existent courses return appropriate error messages
- [ ] JSON parsing errors are handled
- [ ] Vector store connection errors are handled
- [ ] Tool execution errors are caught and reported

## 🚀 Deployment Steps

### **1. Development Environment**
1. Implement all code changes
2. Test with sample data
3. Validate functionality
4. Fix any issues

### **2. Staging Environment**
1. Deploy to staging
2. Run integration tests
3. Test with real course data
4. Validate user experience

### **3. Production Environment**
1. Deploy to production
2. Monitor system performance
3. Collect user feedback
4. Iterate based on usage

## 📝 Post-Implementation Tasks

### **Documentation**
- [ ] Update API documentation
- [ ] Create user guide for course outline queries
- [ ] Document tool usage examples
- [ ] Update system architecture documentation

### **Monitoring**
- [ ] Set up logging for tool usage
- [ ] Monitor performance metrics
- [ ] Track error rates
- [ ] Collect user feedback

### **Optimization**
- [ ] Optimize query performance
- [ ] Improve error handling
- [ ] Enhance user experience
- [ ] Add additional features based on usage

---

**Implementation Guide Version:** 1.0  
**Created:** September 27, 2025, 20:30 MST  
**Status:** 📋 Ready for Implementation
