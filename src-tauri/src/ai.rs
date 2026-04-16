use crate::commands;
use crate::db::DbState;
use ollama_rs::generation::chat::request::ChatMessageRequest;
use ollama_rs::generation::chat::ChatMessage;
use ollama_rs::generation::tools::{ToolFunctionInfo, ToolInfo, ToolType};
use ollama_rs::Ollama;
use serde_json::{json, Value};
use tauri::State;

pub struct OllamaAgent {
    client: Ollama,
    model: String,
}

impl OllamaAgent {
    pub fn new(model: String) -> Self {
        Self {
            client: Ollama::default(),
            model,
        }
    }

    pub async fn chat(
        &self,
        history: Vec<ChatMessage>,
        state: &State<'_, DbState>,
    ) -> Result<Value, String> {
        let mut tool_history = history;

        let tools = vec![
            get_finance_summary_info(),
            get_livestock_info(),
            get_workers_info(),
            add_finance_record_info(),
        ];

        let request =
            ChatMessageRequest::new(self.model.clone(), tool_history.clone()).tools(tools.clone());

        let mut response = self
            .client
            .send_chat_messages(request)
            .await
            .map_err(|e| e.to_string())?;

        for _ in 0..5 {
            let message = response.message.clone();
            tool_history.push(message.clone());

            if !message.tool_calls.is_empty() {
                for call in &message.tool_calls {
                    let tool_name = call.function.name.clone();
                    let args = call.function.arguments.clone();

                    let result = execute_tool(&tool_name, args, state).await?;

                    tool_history.push(ChatMessage::new(
                        ollama_rs::generation::chat::MessageRole::Tool,
                        result.to_string(),
                    ));
                }

                let request = ChatMessageRequest::new(self.model.clone(), tool_history.clone())
                    .tools(tools.clone());

                response = self
                    .client
                    .send_chat_messages(request)
                    .await
                    .map_err(|e| e.to_string())?;
            } else {
                break;
            }
        }

        Ok(json!({
            "message": {
                "role": "assistant",
                "content": response.message.content
            }
        }))
    }
}

fn get_finance_summary_info() -> ToolInfo {
    ToolInfo {
        tool_type: ToolType::Function,
        function: ToolFunctionInfo {
            name: "get_finance_summary".to_string(),
            description: "Get a summary of income and expenses for the farm.".to_string(),
            parameters: serde_json::from_value(json!({
                "type": "object",
                "properties": {
                    "start_date": { "type": "string", "description": "YYYY-MM-DD" }
                }
            }))
            .unwrap(),
        },
    }
}

fn get_livestock_info() -> ToolInfo {
    ToolInfo {
        tool_type: ToolType::Function,
        function: ToolFunctionInfo {
            name: "get_livestock".to_string(),
            description: "List all livestock in the farm.".to_string(),
            parameters: serde_json::from_value(json!({ "type": "object", "properties": {} }))
                .unwrap(),
        },
    }
}

fn get_workers_info() -> ToolInfo {
    ToolInfo {
        tool_type: ToolType::Function,
        function: ToolFunctionInfo {
            name: "get_workers".to_string(),
            description: "List all farm workers.".to_string(),
            parameters: serde_json::from_value(json!({ "type": "object", "properties": {} }))
                .unwrap(),
        },
    }
}

fn add_finance_record_info() -> ToolInfo {
    ToolInfo {
        tool_type: ToolType::Function,
        function: ToolFunctionInfo {
            name: "add_finance_record".to_string(),
            description: "Add a new financial record to the system.".to_string(),
            parameters: serde_json::from_value(json!({
                "type": "object",
                "properties": {
                    "record_type": { "type": "string", "enum": ["income", "expense"] },
                    "category": { "type": "string" },
                    "amount": { "type": "number" },
                    "date": { "type": "string" },
                    "description": { "type": "string" }
                },
                "required": ["record_type", "category", "amount", "date"]
            }))
            .unwrap(),
        },
    }
}

async fn execute_tool(
    name: &str,
    args: Value,
    state: &State<'_, DbState>,
) -> Result<Value, String> {
    match name {
        "get_finance_summary" => {
            let start_date = args["start_date"]
                .as_str()
                .unwrap_or("2020-01-01")
                .to_string();
            commands::get_finance_summary_logic(state, start_date)
        }
        "get_livestock" => {
            let list = commands::get_livestock_logic(state)?;
            Ok(json!(list))
        }
        "get_workers" => {
            let workers = commands::get_workers_logic(state)?;
            Ok(json!(workers))
        }
        "add_finance_record" => {
            let r_type = args["record_type"]
                .as_str()
                .unwrap_or("expense")
                .to_string();
            let cat = args["category"].as_str().unwrap_or("General").to_string();
            let amt = args["amount"].as_f64().unwrap_or(0.0);
            let date = args["date"].as_str().unwrap_or("2026-04-14").to_string();
            let desc = args["description"].as_str().unwrap_or("").to_string();
            let id = commands::add_finance_record_logic(
                state, r_type, cat, amt, date, desc, None, None,
            )?;
            Ok(json!({ "id": id, "status": "success" }))
        }
        _ => Err(format!("Unknown tool: {}", name)),
    }
}
