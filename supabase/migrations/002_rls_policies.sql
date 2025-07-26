-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for research_documents table
CREATE POLICY "Users can view their own documents" ON research_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON research_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON research_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON research_documents
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for tags table
CREATE POLICY "Users can view all tags" ON tags
  FOR SELECT USING (true);

CREATE POLICY "Users can create tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update tags they created" ON tags
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for document_tags table
CREATE POLICY "Users can view document tags for their documents" ON document_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM research_documents rd 
      WHERE rd.id = document_tags.document_id 
      AND rd.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage tags for their documents" ON document_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM research_documents rd 
      WHERE rd.id = document_tags.document_id 
      AND rd.user_id = auth.uid()
    )
  );

-- RLS Policies for chat_conversations table
CREATE POLICY "Users can view their own conversations" ON chat_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON chat_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON chat_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_messages table
CREATE POLICY "Users can view messages from their conversations" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations cc 
      WHERE cc.id = chat_messages.conversation_id 
      AND cc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their conversations" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations cc 
      WHERE cc.id = chat_messages.conversation_id 
      AND cc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages from their conversations" ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_conversations cc 
      WHERE cc.id = chat_messages.conversation_id 
      AND cc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their conversations" ON chat_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chat_conversations cc 
      WHERE cc.id = chat_messages.conversation_id 
      AND cc.user_id = auth.uid()
    )
  ); 