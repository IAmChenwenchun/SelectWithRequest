import React from 'react';
import { Form, Button } from 'antd';
import SelectWitchFetch from './index';

const FormItem = Form.Item;
const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 14 },
};
const LIST_CSELECT = [
    {id: '0', name: 'US'},
    {id: '2', name: 'CA'}
];

/**
 * @description 自定义表单组件测试
 */
class TestSelectWitchFetch extends React.Component {

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                console.log('Received values of form: ', values);
            }
        });
    }

    handleChange = (value) =>{
          console.log(value);
    }

    render() {
        const { getFieldDecorator } = this.props.form;
        return (
            <div style={{backgroundColor: '#fff'}}>
                <Form onSubmit={this.handleSubmit}>
                    <FormItem
                        {...formItemLayout}
                        label="站点"
                    >
                        {getFieldDecorator('site', {
                            // initialValue: ['0', '2'],
                            initialValue: [{id:'0', name:'US'}, {id:'2', name:'CA'}],
                            rules: [
                                { required: true, message: '请选择站点' },
                            ],
                        })(
                            <SelectWitchFetch
                                list={LIST_CSELECT} // 默认值列表
                                isNotCache  // 默认有初始数据缓存 为true时不用缓存
                                code='id' // 列表编码字段
                                name='name' // 列表名称字段
                                url='/pls/ebay/motan/service/api/IEbayService/ebaySite'
                                mode='multiple' // 是否多选
                                maxCount={3} // 最多选择项数量
                                formType={1}  // 表单数据类型，不填就是默认值，填1返回对象
                                params={{searchColumn: 'name'}} // 搜索参数
                                apiListType={2}// 数组取值名称 0 默认data -> list  1 data -> data 2 data
                                //其它字段同 Select组件配置
                                handleFilter={this.handleFilter} // 搜索结果过滤
                                localSearch={1} // 是否开启本地过滤检索，默认为 0 不开启，1为 开启
                                disabledOption={['0']} // 禁用的列表选项code
                                stateCode='000001'  // 接口返回状态码
                            />
                        )}
                    </FormItem>
                    <FormItem
                        wrapperCol={{ span: 12, offset: 6 }}
                    >
                        <Button type="primary" htmlType="submit">Submit</Button>
                    </FormItem>
                </Form>
        </div>
        );
    }
}

export default Form.create()(TestSelectWitchFetch);
