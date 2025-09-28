Enhanced Prompt for AI Agent
Objective:
Modify the backend search functionality to include a URL with each source citation returned by the chat interface. This will enable the frontend to render each source as a clickable hyperlink that opens the corresponding lesson video in a new browser tab.

Background:

The application processes course materials into searchable chunks.

During this process, which occurs in @backend/document_processor.py, a link to the original lesson video is stored for each chunk in the course_catalog database collection.

Currently, the chat interface displays search results with static source citations (e.g., "Source 1: Chapter 5.2"), but these are not linked.

Detailed Requirements:

Locate the Target Function:

The primary modification will be in the _format_results function within the file backend/search_tools.py.

Modify the Data Retrieval Logic:

Inside _format_results, for each source document being processed, you must retrieve its corresponding lesson URL from the course_catalog collection.

You will likely need to use an identifier from the source document (e.g., course_id, lesson_id, or source_name) to perform the lookup in course_catalog.

Update the Response Structure:

Augment the data structure for each returned source to include the retrieved URL. The key for the URL should be clear and consistent, for example, link.

Example Current Structure (Simplified):

JSON

{
  "source": "Lesson 1.2: Introduction to Python",
  "content": "..."
}
Example Desired Structure (Simplified):

JSON

{
  "source": "Lesson 1.2: Introduction to Python",
  "content": "...",
  "link": "https://example.com/courses/python/lesson-1-2"
}
Final Outcome:
The _format_results function should return a list of sources, where each source object contains the necessary data for the frontend to render a hyperlink. The frontend will handle the "invisible embedding" by using the source text as the link's display text and the link value for the href attribute, like so: <a href="[link_value]" target="_blank">[source_text]</a>.